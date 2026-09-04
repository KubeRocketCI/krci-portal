import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useColumnSync } from "./useColumnSync";
import { useColumnResize } from "./useColumnResize";
import { TableColumn } from "../types";
import { Row, TABLE_SETTINGS_KEY, column, readTableSettings, seedTableSettings } from "../testUtils";

const TABLE_ID = "syncTest";
const OTHER_TABLE_ID = "syncTestOther";

const columns = [column("name", 40), column("status", 30), column("actions", 30)];

type Props = { columns: TableColumn<Row>[]; id: string };

const renderSync = (initial: Partial<Props> = {}) =>
  renderHook((props: Props) => useColumnSync<Row>(props.columns, props.id), {
    initialProps: { columns, id: TABLE_ID, ...initial },
  });

const visibility = (result: { current: { columns: TableColumn<Row>[] } }) =>
  Object.fromEntries(result.current.columns.map((c) => [c.id, c.cell.show !== false]));

describe("useColumnSync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saved visibility", () => {
    it("hides a column with a saved show:false on the first render", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: false } } });

      const { result } = renderSync();

      expect(visibility(result)).toEqual({ name: true, status: false, actions: true });
    });

    it("shows a column hidden in code when the saved show is true", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: true } } });

      const { result } = renderSync({ columns: [column("name", 40), column("status", 30, { show: false })] });

      expect(visibility(result)).toEqual({ name: true, status: true });
    });

    it("keeps a code show:false when nothing is saved", () => {
      const { result } = renderSync({ columns: [column("name", 40), column("status", 30, { show: false })] });

      expect(visibility(result)).toEqual({ name: true, status: false });
    });

    it("leaves show alone for a width-only entry", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", width: 300 } } });

      const { result } = renderSync();

      expect(visibility(result)).toEqual({ name: true, status: true, actions: true });
    });

    it("ignores a saved show that is not a boolean", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: "no" as unknown as boolean } } });

      const { result } = renderSync();

      expect(visibility(result).status).toBe(true);
    });

    it("ignores settings saved under another table id", () => {
      seedTableSettings({ [OTHER_TABLE_ID]: { status: { id: "status", show: false } } });

      const { result } = renderSync();

      expect(visibility(result).status).toBe(true);
      expect(result.current.columns).toBe(columns);
    });

    it("ignores a saved entry for an id that is not a column", () => {
      seedTableSettings({ [TABLE_ID]: { gone: { id: "gone", show: false } } });

      const { result } = renderSync();

      expect(result.current.columns).toBe(columns);
    });

    it("returns the prop array itself when nothing is saved", () => {
      const { result } = renderSync();

      expect(result.current.columns).toBe(columns);
    });

    it("returns the prop array itself when the saved value equals the code value", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: true } } });

      const { result } = renderSync();

      expect(result.current.columns).toBe(columns);
    });

    it("renders the code columns when storage is corrupt", () => {
      localStorage.setItem(TABLE_SETTINGS_KEY, "{not json");

      const { result } = renderSync();

      expect(result.current.columns).toBe(columns);
    });
  });

  describe("re-sync", () => {
    it("keeps state and a toggle across a fresh array with the same ids", () => {
      const { result, rerender } = renderSync();
      act(() => result.current.toggleColumnVisibility("status", false));
      const toggled = result.current.columns;

      rerender({ columns: columns.map((c) => ({ ...c })), id: TABLE_ID });

      expect(result.current.columns).toBe(toggled);
      expect(visibility(result).status).toBe(false);
    });

    it("re-reads the new table's settings on a table id change and drops the old table's toggle", () => {
      seedTableSettings({ [OTHER_TABLE_ID]: { name: { id: "name", show: false } } });
      const { result, rerender } = renderSync();
      act(() => result.current.toggleColumnVisibility("status", false));

      rerender({ columns, id: OTHER_TABLE_ID });

      expect(visibility(result)).toEqual({ name: false, status: true, actions: true });
    });

    it("re-applies saved visibility to surviving ids when the column set changes; a new id takes its code value", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: false } } });
      const { result, rerender } = renderSync();

      rerender({ columns: [...columns, column("extra", 10)], id: TABLE_ID });

      expect(visibility(result)).toEqual({ name: true, status: false, actions: true, extra: true });
    });

    it("carries a session toggle across a column set change, because the toggle was persisted", () => {
      const { result, rerender } = renderSync();
      act(() => result.current.toggleColumnVisibility("status", false));

      rerender({ columns: [...columns, column("extra", 10)], id: TABLE_ID });

      expect(visibility(result).status).toBe(false);
    });
  });

  describe("composed with useColumnResize, in shell order", () => {
    // Shared column id, different floors. The incoming saved width sits below the
    // outgoing floor and above its own, so a derive against the wrong columns shows.
    const OUTGOING_ID = "widthOutgoing";
    const INCOMING_ID = "widthIncoming";
    const outgoing = [column("name", 40, { minWidth: 400 }), column("other", 60)];
    const incoming = [column("name", 40, { minWidth: 50 }), column("other", 60)];
    const INCOMING_SAVED_WIDTH = 120;

    const renderShellHooks = () =>
      renderHook(
        (props: Props) => {
          const sync = useColumnSync<Row>(props.columns, props.id);
          return useColumnResize<Row>({ tableId: props.id, columns: sync.columns });
        },
        { initialProps: { columns: outgoing, id: OUTGOING_ID } }
      );

    it("resolves the incoming table's saved width against the incoming column's floor on an id change", () => {
      seedTableSettings({ [INCOMING_ID]: { name: { id: "name", width: INCOMING_SAVED_WIDTH } } });
      const { result, rerender } = renderShellHooks();

      rerender({ columns: incoming, id: INCOMING_ID });

      expect(result.current.getColProps("name").style.width).toBe(INCOMING_SAVED_WIDTH);
    });
  });

  describe("toggleColumnVisibility", () => {
    it("updates state and persists show, leaving a sibling width intact", () => {
      seedTableSettings({ [TABLE_ID]: { status: { id: "status", width: 300 } } });
      const { result } = renderSync();

      act(() => result.current.toggleColumnVisibility("status", false));

      expect(visibility(result).status).toBe(false);
      expect(readTableSettings()[TABLE_ID].status).toEqual({ id: "status", width: 300, show: false });
    });

    it("creates an entry carrying only id and show for a column with no entry", () => {
      const { result } = renderSync();

      act(() => result.current.toggleColumnVisibility("name", false));

      expect(readTableSettings()[TABLE_ID]).toEqual({ name: { id: "name", show: false } });
    });

    it("keeps the other columns' identity", () => {
      const { result } = renderSync();
      const before = result.current.columns;

      act(() => result.current.toggleColumnVisibility("status", false));

      expect(result.current.columns[0]).toBe(before[0]);
      expect(result.current.columns[2]).toBe(before[2]);
    });
  });
});
