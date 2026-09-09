import { describe, expect, it } from "vitest";
import { decodeSvgIcon, validateSvgIcon } from "./index";

const b64 = (value: string) => Buffer.from(value, "utf-8").toString("base64");

const markupOf = (src: string) => decodeURIComponent(src.replace("data:image/svg+xml;charset=utf-8,", ""));

const PLAIN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';

describe("decodeSvgIcon", () => {
  it("reports an absent icon", () => {
    expect(decodeSvgIcon(undefined)).toEqual({ status: "absent" });
    expect(decodeSvgIcon("")).toEqual({ status: "absent" });
  });

  it("reports a clean icon as untouched", () => {
    const result = decodeSvgIcon(b64(PLAIN_SVG));

    expect(result.status).toBe("ok");
    expect(result).toMatchObject({ sanitized: false });
    expect(result.status === "ok" && markupOf(result.src)).toContain("<circle");
  });

  it("strips a script tag and reports that it sanitized", () => {
    const result = decodeSvgIcon(b64('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));

    expect(result).toMatchObject({ status: "ok", sanitized: true });
    expect(result.status === "ok" && markupOf(result.src)).not.toContain("script");
  });

  it("strips an event handler and reports that it sanitized", () => {
    const result = decodeSvgIcon(b64('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'));

    expect(result).toMatchObject({ status: "ok", sanitized: true });
    expect(result.status === "ok" && markupOf(result.src)).not.toContain("onload");
  });

  it("accepts a data-URI wrapped payload", () => {
    expect(decodeSvgIcon(`data:image/svg+xml;base64,${b64(PLAIN_SVG)}`)).toMatchObject({ status: "ok" });
  });

  it("accepts a data URI carrying MIME parameters", () => {
    expect(decodeSvgIcon(`data:image/svg+xml;charset=utf-8;base64,${b64(PLAIN_SVG)}`)).toMatchObject({
      status: "ok",
    });
    expect(decodeSvgIcon(`data:image/svg+xml; charset=utf-8; base64,${b64(PLAIN_SVG)}`)).toMatchObject({
      status: "ok",
    });
    expect(decodeSvgIcon(`data:image/svg+xml;BASE64,${b64(PLAIN_SVG)}`)).toMatchObject({ status: "ok" });
  });

  it("reports a data URI that carries no base64 token", () => {
    const percentEncoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLAIN_SVG)}`;

    expect(decodeSvgIcon(percentEncoded)).toEqual({
      status: "invalid",
      reason: "data URI is not base64-encoded",
    });
    expect(decodeSvgIcon(`data:image/svg+xml,${encodeURIComponent(PLAIN_SVG)}`)).toEqual({
      status: "invalid",
      reason: "data URI is not base64-encoded",
    });
  });

  it("accepts the base64url alphabet", () => {
    const standard = b64(PLAIN_SVG);
    const urlSafe = standard.replace(/\+/g, "-").replace(/\//g, "_");

    expect(decodeSvgIcon(urlSafe)).toMatchObject({ status: "ok" });
  });

  it("accepts an XML declaration before the root element", () => {
    expect(decodeSvgIcon(b64(`<?xml version="1.0" encoding="UTF-8"?>${PLAIN_SVG}`))).toMatchObject({ status: "ok" });
  });

  it("round-trips non-Latin1 content", () => {
    const result = decodeSvgIcon(b64('<svg xmlns="http://www.w3.org/2000/svg"><text>Ω — ok</text></svg>'));

    expect(result.status === "ok" && markupOf(result.src)).toContain("Ω — ok");
  });

  it("reports a value that is not base64", () => {
    expect(decodeSvgIcon("not-valid-base64!@#$%^")).toEqual({ status: "invalid", reason: "not valid base64" });
  });

  it("reports a length that cannot be base64", () => {
    expect(decodeSvgIcon("dashboard")).toEqual({ status: "invalid", reason: "not valid base64" });
  });

  it("distinguishes raw SVG markup from other invalid input", () => {
    expect(decodeSvgIcon(PLAIN_SVG)).toEqual({ status: "invalid", reason: "expected base64, got raw SVG markup" });
  });

  it("reports base64 that does not decode to an SVG", () => {
    expect(decodeSvgIcon(b64("just some text"))).toEqual({
      status: "invalid",
      reason: "decoded content is not an SVG",
    });
  });

  it("caches by raw value", () => {
    const icon = b64('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>');

    expect(decodeSvgIcon(icon)).toBe(decodeSvgIcon(icon));
  });
});

describe("validateSvgIcon", () => {
  it("passes a clean icon", () => {
    expect(validateSvgIcon(b64(PLAIN_SVG))).toBeUndefined();
  });

  it("passes an absent value to the field's own required check", () => {
    expect(validateSvgIcon("")).toBeUndefined();
  });

  it("rejects an undecodable value with the reason", () => {
    expect(validateSvgIcon("dashboard")).toBe("Invalid icon: not valid base64.");
  });

  it("rejects content that had to be stripped", () => {
    expect(validateSvgIcon(b64('<svg xmlns="http://www.w3.org/2000/svg"><iframe src="x"/></svg>'))).toBe(
      "Icon contains forbidden elements or event handlers."
    );
  });
});
