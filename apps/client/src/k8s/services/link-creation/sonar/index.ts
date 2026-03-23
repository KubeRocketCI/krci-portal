const trimBase = (url: string) => {
  let end = url.length;
  while (end > 0 && url[end - 1] === "/") end--;
  return end === url.length ? url : url.slice(0, end);
};

export const SonarQubeURLService = {
  createDashboardLink: ({ baseURL, codebaseName }: { baseURL: string | undefined; codebaseName: string }) => {
    if (!baseURL) {
      return undefined;
    }

    const dashboardURL = new URL(`${trimBase(baseURL)}/dashboard`);

    dashboardURL.searchParams.append("id", codebaseName);

    return dashboardURL.toString();
  },
  createLinkByIssueType: ({
    baseURL,
    codebaseName,
    issueType,
  }: {
    baseURL: string;
    codebaseName: string;
    issueType: string;
  }) => {
    if (!baseURL) {
      return undefined;
    }

    const dashboardURL = new URL(`${trimBase(baseURL)}/project/issues`);

    dashboardURL.searchParams.append("id", codebaseName);
    dashboardURL.searchParams.append("resolved", "false");
    dashboardURL.searchParams.append("types", issueType);

    return dashboardURL.toString();
  },
  createLinkByMetricName: ({
    baseURL,
    codebaseName,
    metricName,
  }: {
    baseURL: string;
    codebaseName: string;
    metricName: string;
  }) => {
    if (!baseURL) {
      return undefined;
    }

    const componentMeasuresURL = new URL(`${trimBase(baseURL)}/component_measures`);

    componentMeasuresURL.searchParams.append("id", codebaseName);
    componentMeasuresURL.searchParams.append("metric", metricName);

    return componentMeasuresURL.toString();
  },
  createSecurityHotspotsLink: ({ baseURL, codebaseName }: { baseURL: string | undefined; codebaseName: string }) => {
    if (!baseURL) {
      return undefined;
    }

    const url = new URL(`${trimBase(baseURL)}/security_hotspots`);
    url.searchParams.append("id", codebaseName);
    return url.toString();
  },
  createMetricsApiUrl: ({ baseURL, codebaseName }: { baseURL: string; codebaseName: string }) => {
    if (!baseURL) {
      return undefined;
    }

    const metricsApiUrl = new URL(`${trimBase(baseURL)}/api/measures/component`);

    metricsApiUrl.searchParams.append("component", codebaseName);
    metricsApiUrl.searchParams.append(
      "metricKeys",
      "bugs,code_smells,coverage,duplicated_lines_density,ncloc,sqale_rating,alert_status,reliability_rating,security_hotspots,security_rating,sqale_index,vulnerabilities"
    );

    return metricsApiUrl.toString();
  },
};
