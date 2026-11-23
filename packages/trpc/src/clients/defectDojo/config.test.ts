import { describe, expect, it } from "vitest";
import { isDefectDojoConfigured, loadDefectDojoConfig } from "./config.js";

const CONFIGURED = { DEFECTDOJO_URL: "http://defectdojo.defectdojo", DEFECTDOJO_TOKEN: "service-token" };

describe("loadDefectDojoConfig", () => {
  it.each([
    ["no variable", {}],
    ["no URL", { DEFECTDOJO_TOKEN: "service-token" }],
    ["no token", { DEFECTDOJO_URL: "http://defectdojo.defectdojo" }],
    ["a blank URL", { ...CONFIGURED, DEFECTDOJO_URL: "  " }],
    ["a blank token", { ...CONFIGURED, DEFECTDOJO_TOKEN: "" }],
  ])("is not configured with %s", (_, env) => {
    expect(loadDefectDojoConfig(env)).toBeNull();
    expect(isDefectDojoConfigured(env)).toBe(false);
  });

  it("is configured when the URL and the token are set", () => {
    expect(isDefectDojoConfigured(CONFIGURED)).toBe(true);
  });

  it("leaves the web URL and the Product Type unset when the environment does not set them", () => {
    expect(loadDefectDojoConfig(CONFIGURED)).toStrictEqual({
      apiBaseURL: "http://defectdojo.defectdojo",
      token: "service-token",
      webBaseURL: undefined,
      productType: undefined,
    });
  });

  it("takes the web URL for links and the Product Type from the environment", () => {
    expect(
      loadDefectDojoConfig({
        ...CONFIGURED,
        DEFECTDOJO_WEB_URL: "https://defectdojo.example.com/",
        DEFECTDOJO_PRODUCT_TYPE: "Platform",
      })
    ).toMatchObject({ webBaseURL: "https://defectdojo.example.com", productType: "Platform" });
  });

  it("trims the values and drops the trailing slash of both URLs", () => {
    expect(
      loadDefectDojoConfig({
        DEFECTDOJO_URL: " http://defectdojo.defectdojo/ ",
        DEFECTDOJO_TOKEN: " service-token ",
        DEFECTDOJO_WEB_URL: " https://defectdojo.example.com// ",
        DEFECTDOJO_PRODUCT_TYPE: " Platform ",
      })
    ).toStrictEqual({
      apiBaseURL: "http://defectdojo.defectdojo",
      token: "service-token",
      webBaseURL: "https://defectdojo.example.com",
      productType: "Platform",
    });
  });

  it("treats a blank web URL and a blank Product Type as not set", () => {
    expect(
      loadDefectDojoConfig({ ...CONFIGURED, DEFECTDOJO_WEB_URL: " ", DEFECTDOJO_PRODUCT_TYPE: " " })
    ).toMatchObject({ webBaseURL: undefined, productType: undefined });
  });
});
