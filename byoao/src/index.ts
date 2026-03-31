// BYOAO — Build Your Own AI OS — plugin for OpenCode
// NOTE: Do NOT export other functions from this file!
// OpenCode treats ALL exports as plugin instances and calls them.

import type { Plugin } from "@opencode-ai/plugin";
import { byoao_init_vault } from "./tools/init-vault.js";
import { byoao_add_person } from "./tools/add-person.js";
import { byoao_add_project } from "./tools/add-project.js";
import { byoao_add_glossary_term } from "./tools/add-glossary-term.js";
import { byoao_vault_status } from "./tools/vault-status.js";
import { byoao_vault_doctor } from "./tools/vault-doctor.js";
import { byoao_switch_provider } from "./tools/switch-provider.js";
import { byoao_search_vault } from "./tools/search-vault.js";
import { byoao_note_read } from "./tools/note-read.js";
import { byoao_graph_health } from "./tools/graph-health.js";
import { byoao_vault_upgrade } from "./tools/vault-upgrade.js";
import { byoao_mcp_auth } from "./tools/mcp-auth.js";
import { systemTransformHook } from "./hooks/system-transform.js";
import { getIdleSuggestion } from "./hooks/idle-suggestions.js";
import { log, sanitizeArgs } from "./lib/logger.js";

const BYOAOPlugin: Plugin = async (ctx) => {
  const { client } = ctx;

  const tools: Record<string, any> = {
    byoao_init_vault,
    byoao_add_person,
    byoao_add_project,
    byoao_add_glossary_term,
    byoao_vault_status,
    byoao_vault_doctor,
    byoao_switch_provider,
    byoao_search_vault,
    byoao_note_read,
    byoao_graph_health,
    byoao_vault_upgrade,
    byoao_mcp_auth,
  };

  // Wrap each tool's execute with error logging
  for (const [name, def] of Object.entries(tools)) {
    const orig = def.execute;
    def.execute = async (args: unknown, toolCtx: unknown) => {
      try {
        return await orig(args, toolCtx);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        void log("error", `tool:${name}`, error.message, {
          error,
          context: sanitizeArgs(args),
        }).catch(() => {});
        throw err;
      }
    };
  }

  // Wrap system-transform hook with error logging
  const wrappedHook: typeof systemTransformHook = async (input, output) => {
    try {
      return await systemTransformHook(input, output);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      void log("error", "hook:system-transform", error.message, {
        error,
      }).catch(() => {});
      throw err;
    }
  };

  return {
    tool: tools,
    "experimental.chat.system.transform": wrappedHook,
    event: async ({ event }) => {
      try {
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
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        void log("error", `event:${event.type}`, error.message, {
          error,
        }).catch(() => {});
      }
    },
  };
};

export default BYOAOPlugin;
