# n8n-nodes-parse-bot

An independent community node for [Parse.bot](https://parse.bot), not affiliated with Parse. Turn websites into callable APIs and use them in workflows or as an AI Agent tool.

## Install
Install `n8n-nodes-parse-bot` in n8n Community Nodes. Create an API key in Parse Settings → API Keys and add it to Parse.bot API credentials. Marketplace searches are public, but this node requires credentials for consistent setup. Observe your plan's rate and credit limits; private builds and revisions can cost credits.

## Operations
- Dispatch a URL with optional task instructions and marketplace contribution setting.
- Get task status, optionally polling every fifteen seconds until a terminal or needs-input state. Polling stops after the selected maximum and returns the latest result.
- Provide requested input as a JSON object.
- Revise a completed API with natural-language instructions.
- Call a scraper endpoint using GET query parameters or POST JSON parameters.
- Search public marketplace APIs.

See [Parse quickstart](https://docs.parse.bot/quickstart) for the workflow and [API reference](https://docs.parse.bot/llms.txt) for endpoints. Execute endpoints according to their advertised method and parameter schema. Output is the vendor's JSON, with top-level arrays split into n8n items.

## Example
Import `examples/marketplace-search.json`, select your credentials and run it to search existing APIs before dispatching a website. Dispatch results provide a task ID; use Get Task Status and, once completed, the scraper ID and endpoint names for Call Scraper Endpoint.

## About the author
Khairul Muhtadin, n8n Ambassador ([LinkedIn](https://linkedin.com/in/khmuhtadin)).

**Known issue:** Parse's input-response endpoint rejected the documented `user_response` payload during live testing on 18 November 2026, requiring an undocumented `request_id` and encrypted envelope. The Provide Task Input operation follows the published schema but is not currently verified to work; use the Parse dashboard until the API documentation is clarified.

## Workflow template

[`examples/template-parse-bot-new-listings-watch.json`](examples/template-parse-bot-new-listings-watch.json): **Watch a website for new listings with Parse.bot, Google Sheets and Slack**. Import it in n8n (Workflows > Import from file). Setup steps are in the yellow sticky note.
