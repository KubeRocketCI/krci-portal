import { describe, it, expect } from "vitest";
import { GitURLService } from "./index";
import { gitProvider } from "@my-project/shared";

describe("testing link-creation GitURLService", () => {
  it("should successfully create git ops value file url  based on given gitOpsWebUrl, pipeline name,  stage name, app name and git server params", () => {
    expect(
      GitURLService.createGitOpsValuesYamlFileLink(
        "https://git.test.com/test-project/test-env/krci-gitops",
        "test-pipeline-name",
        "test-stage-name",
        "test-app-name",
        gitProvider.github
      )
    ).toEqual(
      "https://git.test.com/test-project/test-env/krci-gitops/blob/main/test-pipeline-name/test-stage-name/test-app-name-values.yaml"
    );
    expect(
      GitURLService.createGitOpsValuesYamlFileLink(
        "https://git.test.com/test-project/test-env/krci-gitops",
        "test-pipeline-name",
        "test-stage-name",
        "test-app-name",
        gitProvider.gitlab
      )
    ).toEqual(
      "https://git.test.com/test-project/test-env/krci-gitops/blob/main/test-pipeline-name/test-stage-name/test-app-name-values.yaml"
    );
    expect(
      GitURLService.createGitOpsValuesYamlFileLink(
        "https://test-gerrit.com/gitweb?p=krci-gitops.git",
        "test-pipeline-name",
        "test-stage-name",
        "test-app-name",
        gitProvider.gerrit
      )
    ).toEqual(
      "https://test-gerrit.com/gitweb?p=krci-gitops.git&f=test-pipeline-name%2Ftest-stage-name%2Ftest-app-name-values.yaml&hb=refs%2Fheads%2Fmain&a=blob"
    );
    expect(
      GitURLService.createGitOpsValuesYamlFileLink(
        "https://git.test.com/test-project/test-env/krci-gitops",
        "test-pipeline-name",
        "test-stage-name",
        "test-app-name",
        gitProvider.bitbucket
      )
    ).toEqual(
      "https://git.test.com/test-project/test-env/krci-gitops/src/main/test-pipeline-name/test-stage-name/test-app-name-values.yaml"
    );
  });

  it("should successfully create repo branch link based on given git server, baseUrl, and branch", () => {
    expect(
      GitURLService.createRepoBranchLink(
        gitProvider.github,
        "https://git.test.com/test-project/test-repo",
        "test-branch"
      )
    ).toEqual("https://git.test.com/test-project/test-repo/tree/test-branch");
    expect(
      GitURLService.createRepoBranchLink(
        gitProvider.gitlab,
        "https://git.test.com/test-project/test-repo",
        "test-branch"
      )
    ).toEqual("https://git.test.com/test-project/test-repo/-/tree/test-branch");
    expect(
      GitURLService.createRepoBranchLink(
        gitProvider.gerrit,
        "https://test-gerrit.com/gitweb?p=test-repo",
        "test-branch"
      )
    ).toEqual("https://test-gerrit.com/gitweb?p=test-repo&a=refs%2Fheads%2Ftest-branch");
    expect(
      GitURLService.createRepoBranchLink(
        gitProvider.bitbucket,
        "https://git.test.com/test-project/test-repo",
        "feature/test-branch"
      )
    ).toEqual("https://git.test.com/test-project/test-repo/src/HEAD/?at=feature%2Ftest-branch");
  });
});
