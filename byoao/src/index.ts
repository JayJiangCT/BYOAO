// BYOAO — Build Your Own AI OS — plugin for OpenCode
// NOTE: Do NOT export other functions from this file!
// OpenCode treats ALL exports as plugin instances and calls them.

import type { Plugin } from "@opencode-ai/plugin";
import { byoao_init_vault } from "./tools/init-vault.js";
import { byoao_add_member } from "./tools/add-member.js";
import { byoao_add_project } from "./tools/add-project.js";
import { byoao_add_glossary_term } from "./tools/add-glossary-term.js";
import { byoao_vault_status } from "./tools/vault-status.js";
import { byoao_vault_doctor } from "./tools/vault-doctor.js";
import { byoao_switch_provider } from "./tools/switch-provider.js";
import { byoao_search_vault } from "./tools/search-vault.js";
import { byoao_note_read } from "./tools/note-read.js";
import { byoao_graph_health } from "./tools/graph-health.js";
import { systemTransformHook } from "./hooks/system-transform.js";
import { getIdleSuggestion } from "./hooks/idle-suggestions.js";

const BYOAOPlugin: Plugin = async (ctx) => {
  // Capture client from plugin context for use in hooks via closure
  const { client } = ctx;

  return {
    tool: {
      byoao_init_vault,
      byoao_add_member,
      byoao_add_project,
      byoao_add_glossary_term,
      byoao_vault_status,
      byoao_vault_doctor,
      byoao_switch_provider,
      byoao_search_vault,
      byoao_note_read,
      byoao_graph_health,
    },
    "experimental.chat.system.transform": systemTransformHook,
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const suggestion = getIdleSuggestion();
        if (suggestion) {
          client.tui.showToast({
            body: {
              title: "BYOAO",
              message: suggestion,
              variant: "info",
              duration: 5000,
            },
          });
        }
      }
    },
  };
};

export default BYOAOPlugin;
