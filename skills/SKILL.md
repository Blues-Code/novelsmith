---
name: novelsmith
description: Autonomous novel writing CLI agent - use for creative fiction writing, novel generation, style imitation, chapter continuation/import, EPUB export, AIGC detection, and fan fiction. Native English support with 10 built-in English genre profiles (LitRPG, Progression Fantasy, Isekai, Cultivation, System Apocalypse, Dungeon Core, Romantasy, Sci-Fi, Tower Climber, Cozy Fantasy). Also supports Chinese web novel genres (xuanhuan, xianxia, urban, horror, other). Multi-agent pipeline, two-phase writer (creative + settlement), 33-dimension auditing, token usage analytics, creative brief input, structured logging (JSON Lines), multi-model routing, and custom OpenAI-compatible provider support.
version: 1.5.0
metadata: { "openclaw": { "emoji": "📖", "requires": { "bins": ["novelsmith", "node"], "env": [] }, "primaryEnv": "", "homepage": "https://github.com/Narcooo/novelsmith", "install": [{ "id": "npm", "kind": "node", "package": "@mrweijh/novelsmith", "label": "Install novelsmith (npm)" }] } }
---

# novelsmith - Autonomous Novel Writing Agent

novelsmith is a CLI tool for autonomous fiction writing powered by LLM agents. It orchestrates a 5-agent pipeline (Radar → Architect → Writer → Auditor → Reviser) to generate, audit, and revise novel content with style consistency and quality control.

The Writer uses a two-phase architecture: Phase 1 (creative writing, temp 0.7) produces the chapter text, then Phase 2 (state settlement, temp 0.3) updates all truth files for long-term consistency.

## When to Use novelsmith

- **English novel writing**: Native English support with 10 genre profiles (LitRPG, Progression Fantasy, Isekai, etc.). Set `--lang en`
- **Chinese web novel writing**: 5 built-in Chinese genres (xuanhuan, xianxia, urban, horror, other)
- **Fan fiction**: Create fanfic from source material with 4 modes (canon, au, ooc, cp)
- **Batch chapter generation**: Generate multiple chapters with consistent quality
- **Import & continue**: Import existing chapters from a text file, reverse-engineer truth files, and continue writing
- **Style imitation**: Analyze and adopt writing styles from reference texts
- **Spinoff writing**: Write prequels/sequels/spinoffs while maintaining parent canon
- **Quality auditing**: Detect AI-generated content and perform 33-dimension quality checks
- **Genre exploration**: Explore trends and create custom genre rules
- **Analytics**: Track word count, audit pass rate, and issue distribution per book

## Initial Setup

### First Time Setup
```bash
# Initialize a project directory (creates config structure)
novelsmith init my-writing-project

# Configure your LLM provider (OpenAI, Anthropic, or any OpenAI-compatible API)
novelsmith config set-global --provider openai --base-url https://api.openai.com/v1 --api-key sk-xxx --model gpt-4o
# For compatible/proxy endpoints, use --provider custom:
# novelsmith config set-global --provider custom --base-url https://your-proxy.com/v1 --api-key sk-xxx --model gpt-4o
```

### Multi-Model Routing (Optional)
```bash
# Assign different models to different agents — balance quality and cost
novelsmith config set-model writer claude-sonnet-4-20250514 --provider anthropic --base-url https://api.anthropic.com --api-key-env ANTHROPIC_API_KEY
novelsmith config set-model auditor gpt-4o --provider openai
novelsmith config show-models
```
Agents without explicit overrides fall back to the global model.

### View System Status
```bash
# Check installation and configuration
novelsmith doctor

# View current config
novelsmith status
```

## Common Workflows

### Workflow 1: Create a New Novel

1. **Initialize and create book**:
   ```bash
   novelsmith book create --title "My Novel Title" --genre xuanhuan --chapter-words 3000
   # Or with a creative brief (your worldbuilding doc / ideas):
   novelsmith book create --title "My Novel Title" --genre xuanhuan --chapter-words 3000 --brief my-ideas.md
   ```
   - Genres: `xuanhuan` (cultivation), `xianxia` (immortal), `urban` (city), `horror`, `other`
   - Returns a `book-id` for all subsequent operations

2. **Generate initial chapters** (e.g., 5 chapters):
   ```bash
   novelsmith write next book-id --count 5 --words 3000 --context "young protagonist discovering powers"
   ```
   - The `write next` command runs the full pipeline: draft → audit → revise
   - `--context` provides guidance to the Architect and Writer agents
   - Returns JSON with chapter details and quality metrics

3. **Review and approve chapters**:
   ```bash
   novelsmith review list book-id
   novelsmith review approve-all book-id
   ```

4. **Export the book** (supports txt, md, epub):
   ```bash
   novelsmith export book-id
   novelsmith export book-id --format epub
   ```

### Workflow 2: Continue Writing Existing Novel

1. **List your books**:
   ```bash
   novelsmith book list
   ```

2. **Continue from last chapter**:
   ```bash
   novelsmith write next book-id --count 3 --words 2500 --context "protagonist faces critical choice"
   ```
   - novelsmith maintains 7 truth files (world state, character matrix, emotional arcs, etc.) for consistency
   - If only one book exists, omit `book-id` for auto-detection

3. **Review and approve**:
   ```bash
   novelsmith review approve-all
   ```

### Workflow 3: Import Existing Chapters & Continue

Use this when you have an existing novel (or partial novel) and want novelsmith to pick up where it left off.

1. **Import from a single text file** (auto-splits by chapter headings):
   ```bash
   novelsmith import chapters book-id --from novel.txt
   ```
   - Automatically splits by `第X章` pattern
   - Custom split pattern: `--split "Chapter\\s+\\d+"`

2. **Import from a directory** of separate chapter files:
   ```bash
   novelsmith import chapters book-id --from ./chapters/
   ```
   - Reads `.md` and `.txt` files in sorted order

3. **Resume interrupted import**:
   ```bash
   novelsmith import chapters book-id --from novel.txt --resume-from 15
   ```

4. **Continue writing** from the imported chapters:
   ```bash
   novelsmith write next book-id --count 3
   ```
   - novelsmith reverse-engineers all 7 truth files from the imported chapters
   - Generates a style guide from the existing text
   - New chapters maintain consistency with imported content

### Workflow 4: Style Imitation

1. **Analyze reference text**:
   ```bash
   novelsmith style analyze reference_text.txt
   ```
   - Examines vocabulary, sentence structure, tone, pacing

2. **Import style to your book**:
   ```bash
   novelsmith style import reference_text.txt book-id --name "Author Name"
   ```
   - All future chapters adopt this style profile
   - Style rules become part of the Reviser's audit criteria

### Workflow 5: Spinoff/Prequel Writing

1. **Import parent canon**:
   ```bash
   novelsmith import canon spinoff-book-id --from parent-book-id
   ```
   - Creates links to parent book's world state, characters, and events
   - Reviser enforces canon consistency

2. **Continue spinoff**:
   ```bash
   novelsmith write next spinoff-book-id --count 3 --context "alternate timeline after Chapter 20"
   ```

### Workflow 6: Fine-Grained Control (Draft → Audit → Revise)

If you need separate control over each pipeline stage:

1. **Generate draft only**:
   ```bash
   novelsmith draft book-id --words 3000 --context "protagonist escapes" --json
   ```

2. **Audit the chapter** (33-dimension quality check):
   ```bash
   novelsmith audit book-id chapter-1 --json
   ```
   - Returns metrics across 33 dimensions including pacing, dialogue, world-building, outline adherence, and more

3. **Revise with specific mode**:
   ```bash
   novelsmith revise book-id chapter-1 --mode polish --json
   ```
   - Modes: `polish` (minor), `spot-fix` (targeted), `rewrite` (major), `rework` (structure), `anti-detect` (reduce AI traces)

### Workflow 7: Monitor Platform Trends

```bash
novelsmith radar scan
```
- Analyzes trending genres, tropes, and reader preferences
- Informs Architect recommendations for new books

### Workflow 8: Detect AI-Generated Content

```bash
# Detect AIGC in a specific chapter
novelsmith detect book-id

# Deep scan all chapters
novelsmith detect book-id --all
```
- Uses 11 deterministic rules (zero LLM cost) + optional LLM validation
- Returns detection confidence and problematic passages

### Workflow 9: View Analytics

```bash
novelsmith analytics book-id --json
# Shorthand alias
novelsmith stats book-id --json
```
- Total chapters, word count, average words per chapter
- Audit pass rate and top issue categories
- Chapters with most issues, status distribution
- **Token usage stats**: total prompt/completion tokens, avg tokens per chapter, recent trend

### Workflow 10: Write an English Novel

```bash
# Create an English LitRPG novel (language auto-detected from genre)
novelsmith book create --title "The Last Delver" --genre litrpg --chapter-words 3000

# Or set language explicitly
novelsmith book create --title "My Novel" --genre other --lang en

# Set English as default for all projects
novelsmith config set-global --lang en
```
- 10 English genres: litrpg, progression, isekai, cultivation, system-apocalypse, dungeon-core, romantasy, sci-fi, tower-climber, cozy
- Each genre has dedicated pacing rules, fatigue word lists (e.g., "delve", "tapestry", "testament"), and audit dimensions
- Use `novelsmith genre list` to see all available genres

### Workflow 11: Fan Fiction

```bash
# Create a fanfic from source material
novelsmith fanfic init --title "My Fanfic" --from source-novel.txt --mode canon

# Modes: canon (faithful), au (alternate universe), ooc (out of character), cp (ship-focused)
novelsmith fanfic init --title "What If" --from source.txt --mode au --genre other
```
- Imports and analyzes source material automatically
- Fanfic-specific audit dimensions and information boundary controls
- Ensures new content stays consistent with source canon (or deliberately diverges in au/ooc modes)

## Advanced: Natural Language Agent Mode

For flexible, conversational requests:

```bash
novelsmith agent "写一部都市题材的小说，主角是一个年轻律师，第一章三千字"
```
- Agent interprets natural language and invokes appropriate commands
- Useful for complex multi-step requests

## Key Concepts

### Book ID Auto-Detection
If your project contains only one book, most commands accept `book-id` as optional. You can omit it for brevity:
```bash
# Explicit
novelsmith write next book-123 --count 1

# Auto-detected (if only one book exists)
novelsmith write next --count 1
```

### --json Flag
All content-generating commands support `--json` for structured output. Essential for programmatic use:
```bash
novelsmith draft book-id --words 3000 --context "guidance" --json
```

### Truth Files (Long-Term Memory)
novelsmith maintains 7 files per book for coherence:
- **World State**: Maps, locations, technology levels, magic systems
- **Character Matrix**: Names, relationships, arcs, motivations
- **Resource Ledger**: In-world items, money, power levels
- **Chapter Summaries**: Events, progression, foreshadowing
- **Subplot Board**: Active and dormant subplots, hooks
- **Emotional Arcs**: Character emotional progression
- **Pending Hooks**: Unresolved cliffhangers and promises to reader

All agents reference these to maintain long-term consistency. During `import chapters`, these files are reverse-engineered from existing content via the ChapterAnalyzerAgent.

### Two-Phase Writer Architecture
The Writer agent operates in two phases:
- **Phase 1 (Creative)**: Generates the chapter text at temperature 0.7 for creative expression. Only outputs chapter title and content.
- **Phase 2 (Settlement)**: Updates all truth files at temperature 0.3 for precise state tracking. Ensures world state, character arcs, and plot hooks stay consistent.

This separation allows creative freedom in writing while maintaining rigorous continuity tracking.

### Context Guidance
The `--context` parameter provides directional hints to the Writer and Architect:
```bash
novelsmith write next book-id --count 2 --context "protagonist discovers betrayal, must decide whether to trust mentor"
```
- Context is optional but highly recommended for narrative coherence
- Supports both English and Chinese

## Genre Management

### View Built-In Genres
```bash
novelsmith genre list
novelsmith genre show xuanhuan
```

### Create Custom Genre
```bash
novelsmith genre create --name "my-genre" --rules "rule1,rule2,rule3"
```

### Copy and Modify Existing Genre
```bash
novelsmith genre copy xuanhuan --name "dark-xuanhuan" --rules "darker tone, more violence"
```

## Command Reference Summary

| Command | Purpose | Notes |
|---------|---------|-------|
| `novelsmith init [name]` | Initialize project | One-time setup |
| `novelsmith book create` | Create new book | Returns book-id. `--brief <file>`, `--lang en/zh`, `--genre litrpg/progression/...` |
| `novelsmith book list` | List all books | Shows IDs, statuses |
| `novelsmith write next` | Full pipeline (draft→audit→revise) | Primary workflow command |
| `novelsmith draft` | Generate draft only | No auditing/revision |
| `novelsmith audit` | 33-dimension quality check | Standalone evaluation |
| `novelsmith revise` | Revise chapter | Modes: polish/spot-fix/rewrite/rework/anti-detect |
| `novelsmith agent` | Natural language interface | Flexible requests |
| `novelsmith style analyze` | Analyze reference text | Extracts style profile |
| `novelsmith style import` | Apply style to book | Makes style permanent |
| `novelsmith import canon` | Link spinoff to parent | For prequels/sequels |
| `novelsmith import chapters` | Import existing chapters | Reverse-engineers truth files for continuation |
| `novelsmith detect` | AIGC detection | Flags AI-generated passages |
| `novelsmith export` | Export finished book | Formats: txt, md, epub |
| `novelsmith analytics` / `novelsmith stats` | View book statistics | Word count, audit rates, token usage |
| `novelsmith radar scan` | Platform trend analysis | Informs new book ideas |
| `novelsmith config set-global` | Configure LLM provider | OpenAI/Anthropic/custom (any OpenAI-compatible) |
| `novelsmith config set-model <agent> <model>` | Set model override for a specific agent | `--provider`, `--base-url`, `--api-key-env` for multi-provider routing |
| `novelsmith config show-models` | Show current model routing | View per-agent model assignments |
| `novelsmith doctor` | Diagnose issues | Check installation |
| `novelsmith update` | Update to latest version | Self-update |
| `novelsmith up/down` | Daemon mode | Background processing. Logs to `novelsmith.log` (JSON Lines). `-q` for quiet mode |
| `novelsmith review list/approve-all` | Manage chapter approvals | Quality gate |
| `novelsmith fanfic init` | Create fanfic from source material | `--from <file>`, `--mode canon/au/ooc/cp` |
| `novelsmith genre list` | List all available genres | Shows English and Chinese genres with default language |

## Error Handling

### Common Issues

**"book-id not found"**
- Verify the ID with `novelsmith book list`
- Ensure you're in the correct project directory

**"Provider not configured"**
- Run `novelsmith config set-global` with valid credentials
- Check API key and base URL with `novelsmith doctor`

**"Context invalid"**
- Ensure `--context` is a string (wrap in quotes if multi-word)
- Context can be in English or Chinese

**"Audit failed"**
- Check chapter for encoding issues
- Ensure chapter-words matches actual word count
- Try `novelsmith revise` with `--mode rewrite`

**"Book already has chapters" (import)**
- Use `--resume-from <n>` to append to existing chapters
- Or delete existing chapters first

### Running Daemon Mode

For long-running operations:
```bash
# Start background daemon
novelsmith up

# Stop daemon
novelsmith down

# Daemon auto-processes queued chapters
```

## Tips for Best Results

1. **Provide rich context**: The more guidance in `--context`, the more coherent the narrative
2. **Start with style**: If imitating an author, run `novelsmith style import` before generation
3. **Import first**: For existing novels, use `novelsmith import chapters` to bootstrap truth files before continuing
4. **Review regularly**: Use `novelsmith review` to catch issues early
5. **Monitor audits**: Check `novelsmith audit` metrics to understand quality bottlenecks
6. **Use spinoffs strategically**: Import canon before writing prequels/sequels
7. **Batch generation**: Generate multiple chapters together (better continuity)
8. **Check analytics**: Use `novelsmith analytics` to track quality trends over time
9. **Export frequently**: Keep backups with `novelsmith export`

## Support & Resources

- **Homepage**: https://github.com/Narcooo/novelsmith
- **Configuration**: Stored in project root after `novelsmith init`
- **Truth files**: Located in `.novelsmith/` directory per book
- **Logs**: Check output of `novelsmith doctor` for troubleshooting
