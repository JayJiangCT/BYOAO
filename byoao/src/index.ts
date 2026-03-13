// BYOAO — Build Your Own AI OS — plugin for OpenCode
// NOTE: Do NOT export other functions from this file!
// OpenCode treats ALL exports as plugin instances and calls them.

import type { Plugin } from "@opencode-ai/plugin";
import { byoao_init_vault } from "./tools/init-vault.js";
import { byoao_add_member } from "./tools/add-member.js";
import { byoao_add_project } from "./tools/add-project.js";
import { byoao_add_glossary_term } from "./tools/add-glossary-term.js";
import { byoao_vault_status } from "./tools/vault-status.js";

const BYOAOPlugin: Plugin = async (_ctx) => {
  return {
    tool: {
      byoao_init_vault,
      byoao_add_member,
      byoao_add_project,
      byoao_add_glossary_term,
      byoao_vault_status,
    },
  };
};

export default BYOAOPlugin;
