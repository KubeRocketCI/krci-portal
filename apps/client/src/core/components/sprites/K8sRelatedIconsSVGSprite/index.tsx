import Angular from "@/assets/icons/k8s/angular.svg?react";
import Ansible from "@/assets/icons/k8s/ansible.svg?react";
import Antora from "@/assets/icons/k8s/antora.svg?react";
import AWS from "@/assets/icons/k8s/aws.svg?react";
import Beego from "@/assets/icons/k8s/beego.svg?react";
import Bitbucket from "@/assets/icons/k8s/bitbucket.svg?react";
import C from "@/assets/icons/k8s/c.svg?react";
import CMake from "@/assets/icons/k8s/cmake.svg?react";
import Codenarc from "@/assets/icons/k8s/codenarc.svg?react";
import Container from "@/assets/icons/k8s/container.svg?react";
import CPP from "@/assets/icons/k8s/cpp.svg?react";
import CSharp from "@/assets/icons/k8s/csharp.svg?react";
import Docker from "@/assets/icons/k8s/docker.svg?react";
import DotNet from "@/assets/icons/k8s/dot-net.svg?react";
import ECR from "@/assets/icons/k8s/ecr.svg?react";
import Express from "@/assets/icons/k8s/express.svg?react";
import Fastapi from "@/assets/icons/k8s/fastapi.svg?react";
import Flask from "@/assets/icons/k8s/flask.svg?react";
import Gerrit from "@/assets/icons/k8s/gerrit.svg?react";
import Gin from "@/assets/icons/k8s/gin.svg?react";
import Github from "@/assets/icons/k8s/github.svg?react";
import Gitlab from "@/assets/icons/k8s/gitlab.svg?react";
import GitOps from "@/assets/icons/k8s/git-ops.svg?react";
import Go from "@/assets/icons/k8s/go.svg?react";
import Gradle from "@/assets/icons/k8s/gradle.svg?react";
import Groovy from "@/assets/icons/k8s/groovy.svg?react";
import Harbor from "@/assets/icons/k8s/harbor.svg?react";
import Helm from "@/assets/icons/k8s/helm.svg?react";
import Java from "@/assets/icons/k8s/java.svg?react";
import JavaScript from "@/assets/icons/k8s/java-script.svg?react";
import Kaniko from "@/assets/icons/k8s/kaniko.svg?react";
import Kustomize from "@/assets/icons/k8s/kustomize.svg?react";
import Make from "@/assets/icons/k8s/make.svg?react";
import Maven from "@/assets/icons/k8s/maven.svg?react";
import NextJS from "@/assets/icons/k8s/nextjs.svg?react";
import Nexus from "@/assets/icons/k8s/nexus.svg?react";
import None from "@/assets/icons/k8s/none.svg?react";
import Npm from "@/assets/icons/k8s/npm.svg?react";
import Opa from "@/assets/icons/k8s/opa.svg?react";
import Openshift from "@/assets/icons/k8s/openshift.svg?react";
import OperatorSDK from "@/assets/icons/k8s/operator-sdk.svg?react";
import Other from "@/assets/icons/k8s/other.svg?react";
import Python from "@/assets/icons/k8s/python.svg?react";
import ReactSymbol from "@/assets/icons/k8s/react-.svg?react";
import Tekton from "@/assets/icons/k8s/tekton.svg?react";
import Terraform from "@/assets/icons/k8s/terraform.svg?react";
import Vue from "@/assets/icons/k8s/vue.svg?react";
import Pnpm from "@/assets/icons/k8s/pnpm.svg?react";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";

interface UseSpriteSymbolProps {
  name: string;
  [key: string]: string | number;
}

export const UseSpriteSymbol = ({ name, ...props }: UseSpriteSymbolProps) => {
  return (
    <span className="block leading-0">
      <svg {...props}>
        <use xlinkHref={`#${name}`} />
      </svg>
    </span>
  );
};

export const K8sRelatedIconsSVGSprite = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      display="none"
      width="0"
      height="0"
    >
      <Ansible id={RESOURCE_ICON_NAMES.ANSIBLE} />
      <Beego id={RESOURCE_ICON_NAMES.BEEGO} />
      <Codenarc id={RESOURCE_ICON_NAMES.CODENARC} />
      <Container id={RESOURCE_ICON_NAMES.CONTAINER} />
      <Docker id={RESOURCE_ICON_NAMES.DOCKER} />
      <CSharp id={RESOURCE_ICON_NAMES.C_SHARP} />
      <DotNet id={RESOURCE_ICON_NAMES.DOTNET} />
      <Go id={RESOURCE_ICON_NAMES.GO} />
      <Groovy id={RESOURCE_ICON_NAMES.GROOVY_PIPELINE} />
      <Helm id={RESOURCE_ICON_NAMES.HELM} />
      <Gradle id={RESOURCE_ICON_NAMES.GRADLE} />
      <Maven id={RESOURCE_ICON_NAMES.MAVEN} />
      <Npm id={RESOURCE_ICON_NAMES.NPM} />
      <Kaniko id={RESOURCE_ICON_NAMES.KANIKO} />
      <Java id={RESOURCE_ICON_NAMES.JAVA} />
      <JavaScript id={RESOURCE_ICON_NAMES.JAVASCRIPT} />
      <Kustomize id={RESOURCE_ICON_NAMES.KUSTOMIZE} />
      <Opa id={RESOURCE_ICON_NAMES.OPA} />
      <OperatorSDK id={RESOURCE_ICON_NAMES.OPERATOR_SDK} />
      <Other id={RESOURCE_ICON_NAMES.OTHER} />
      <Python id={RESOURCE_ICON_NAMES.PYTHON} />
      <ReactSymbol id={RESOURCE_ICON_NAMES.REACT} />
      <Terraform id={RESOURCE_ICON_NAMES.TERRAFORM} />
      <Fastapi id={RESOURCE_ICON_NAMES.FASTAPI} />
      <Flask id={RESOURCE_ICON_NAMES.FLASK} />
      <Tekton id={RESOURCE_ICON_NAMES.TEKTON} />
      <Gerrit id={RESOURCE_ICON_NAMES.GERRIT} />
      <Github id={RESOURCE_ICON_NAMES.GITHUB} />
      <Gitlab id={RESOURCE_ICON_NAMES.GITLAB} />
      <Bitbucket id={RESOURCE_ICON_NAMES.BITBUCKET} />
      <Vue id={RESOURCE_ICON_NAMES.VUE} />
      <Express id={RESOURCE_ICON_NAMES.EXPRESS} />
      <Angular id={RESOURCE_ICON_NAMES.ANGULAR} />
      <AWS id={RESOURCE_ICON_NAMES.AWS} />
      <Gin id={RESOURCE_ICON_NAMES.GIN} />
      <NextJS id={RESOURCE_ICON_NAMES.NEXTJS} />
      <Antora id={RESOURCE_ICON_NAMES.ANTORA} />
      <GitOps id={RESOURCE_ICON_NAMES.GIT_OPS} />
      <ECR id={RESOURCE_ICON_NAMES.ECR} />
      <Harbor id={RESOURCE_ICON_NAMES.HARBOR} />
      <Openshift id={RESOURCE_ICON_NAMES.OPENSHIFT} />
      <Nexus id={RESOURCE_ICON_NAMES.NEXUS} />
      <None id={RESOURCE_ICON_NAMES.NONE} />
      <Make id={RESOURCE_ICON_NAMES.MAKE} />
      <CMake id={RESOURCE_ICON_NAMES.C_MAKE} />
      <C id={RESOURCE_ICON_NAMES.C} />
      <CPP id={RESOURCE_ICON_NAMES.CPP} />
      <Pnpm id={RESOURCE_ICON_NAMES.PNPM} />
    </svg>
  );
};
