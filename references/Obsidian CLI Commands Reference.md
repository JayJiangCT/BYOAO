# **Obsidian CLI Commands Reference**

This document lists the native commands for the Obsidian CLI as found in the official documentation.

## **Command Syntax**

* **Basic:** obsidian \<command\>  
* **With Parameters:** obsidian \<command\> parameter=value  
* **With Flags:** obsidian \<command\> flag (no value needed)  
* **Targeting Vaults:** obsidian vault="Vault Name" \<command\> (must be first)  
* **Copying Output:** Add \--copy to any command to copy results to clipboard.

## **1\. General Commands**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| help | Show list of all available commands. | \<command\> (Show help for a specific command) |
| version | Show Obsidian version. | \- |
| reload | Reload the app window. | \- |
| restart | Restart the app. | \- |

## **2\. Files and Folders**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| file | Show file info (active by default). | file=\<name\>, path=\<path\> |
| files | List files in the vault. | folder=\<path\>, ext=\<extension\>, total (count only) |
| folder | Show folder info. | path=\<path\> (required), info=files|folders|size |
| folders | List folders in the vault. | folder=\<path\>, total |
| open | Open a file. | file=\<name\>, path=\<path\>, newtab |
| create | Create or overwrite a file. | name=\<name\>, path=\<path\>, content=\<text\>, template=\<name\>, overwrite, open, newtab |
| read | Read file contents. | file=\<name\>, path=\<path\> |
| append | Append content to a file. | file=\<name\>, path=\<path\>, content=\<text\> (req), inline |
| prepend | Prepend content after frontmatter. | file=\<name\>, path=\<path\>, content=\<text\> (req), inline |
| move | Move or rename a file. | file=\<name\>, path=\<path\>, to=\<path\> (req) |
| rename | Rename a file. | file=\<name\>, path=\<path\>, name=\<name\> (req) |
| delete | Delete a file (to trash). | file=\<name\>, path=\<path\>, permanent (skip trash) |

## **3\. Daily Notes**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| daily | Open daily note. | paneType=tab|split|window |
| daily:path | Get daily note path. | \- |
| daily:read | Read daily note contents. | \- |
| daily:append | Append content to daily note. | content=\<text\> (req), paneType=tab|split|window, inline, open |
| daily:prepend | Prepend content to daily note. | content=\<text\> (req), paneType=tab|split|window, inline, open |

## **4\. Search**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| search | Search vault for text. | query=\<text\> (req), path=\<folder\>, limit=\<n\>, format=text|json, total, case (sensitive) |
| search:context | Search with line context. | query=\<text\> (req), path=\<folder\>, limit=\<n\>, total, case |

## **5\. Properties**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| aliases | List aliases. | file=\<name\>, path=\<path\>, total, verbose, active |
| properties | List properties. | file=\<name\>, path=\<path\>, name=\<name\>, sort=count|name, format=yaml|json|tsv, total, counts, active |
| property:set | Set a property. | name=\<name\> (req), value=\<value\> (req), type=text|list|number|checkbox|date|datetime, file=\<name\>, path=\<path\> |
| property:remove | Remove a property. | name=\<name\> (req), file=\<name\>, path=\<path\> |
| property:read | Read a property value. | name=\<name\> (req), file=\<name\>, path=\<path\> |

## **6\. Plugins**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| plugins | List installed plugins. | filter=core|community, versions, format=json|tsv|csv |
| plugins:enabled | List enabled plugins. | filter=core|community, versions, format=json|tsv|csv |
| plugins:restrict | Toggle restricted mode. | on, off |
| plugin | Get plugin info. | id=\<plugin-id\> (req) |
| plugin:enable | Enable a plugin. | id=\<id\> (req), filter=core|community |
| plugin:disable | Disable a plugin. | id=\<id\> (req), filter=core|community |
| plugin:install | Install a community plugin. | id=\<id\> (req), enable |
| plugin:uninstall | Uninstall a plugin. | id=\<id\> (req) |
| plugin:reload | Reload a plugin (dev). | id=\<id\> (req) |

## **7\. Commands & Hotkeys**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| commands | List available command IDs. | filter=\<prefix\> |
| command | Execute an Obsidian command. | id=\<command-id\> (req) |
| hotkeys | List all hotkeys. | total, verbose, format=json|tsv|csv |
| hotkey | Get hotkey for a command. | id=\<command-id\> (req), verbose |

## **8\. Developer Commands**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| devtools | Open developer tools. | \- |
| eval | Run JS in app console. | code="\<javascript\>" (req) |
| dev:screenshot | Take app screenshot. | path=\<path\>.png |
| dev:log | Show console logs. | level=info|warn|error, filter=\<text\> |

## **9\. Publish & Sync**

| Command | Description | Parameters/Flags |
| :---- | :---- | :---- |
| publish:site | Show site info. | \- |
| publish:list | List published files. | total |
| publish:status | List publish changes. | total, new, changed, deleted |
| publish:add | Publish a file/changes. | file=\<name\>, path=\<path\>, changed (publish all) |
| sync:status | Show Sync status. | \- |
| sync:history | List Sync versions. | file=\<name\>, path=\<path\> |

## **10\. Miscellaneous**

* **Bookmarks:** bookmarks, bookmark (file=\<path\>, folder=\<path\>, url=\<url\>, etc.)  
* **Links:** backlinks, links, unresolved, orphans, deadends  
* **Outline:** outline (format=tree|md|json)  
* **Random Notes:** random, random:read  
* **Tags:** tags, tag:files  
* **Tasks:** tasks (daily, overdue, etc.)  
* **Templates:** templates, template:apply  
* **Workspaces:** workspaces, workspace:load, workspace:save