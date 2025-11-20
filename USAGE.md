# How to Use NeuroNote

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm start
   ```
   This starts both the backend (port 3003) and frontend (port 3000)

3. **Open in browser:**
   - Go to http://localhost:3000 (or the port shown in terminal)
   - The app loads with 60 pre-populated cosmos notes to showcase the graph!

4. **Start taking notes:**
   - Click the + button to create a new note
   - Use `[[Note Title]]` to link notes together
   - Watch the graph update automatically!

## What You Get

- ✅ Full note-taking functionality
- ✅ Interactive graph visualization
- ✅ Automatic backlinks detection
- ✅ Search functionality
- ✅ **All data saved to `data/notes.json` file in your project**
- ✅ No API keys or external services needed
- ✅ File-based storage - easy to backup and share

## Where Are My Notes?

Your notes are saved to: `data/notes.json`

You can:
- Open this file in any text editor to see your notes
- Copy it to backup your data
- Commit it to git to version control your notes
- Share it with others by sending the file

## Tips

- **Link notes:** Type `[[` and start typing a note name to create a link
- **Navigate:** Click on links in notes or nodes in the graph
- **Backlinks:** Shows automatically in the right panel under "Linked From"
- **Data persistence:** Your notes are saved automatically to `data/notes.json`
- **Sample data:** Comes with a cosmos dataset - delete `data/notes.json` to start fresh!
- **Backup:** Just copy the `data/notes.json` file anytime

## Running Individual Services

If you need more control:

```bash
npm run server  # Start only the backend (port 3003)
npm run dev     # Start only the frontend (port 3000)
```

Note: You need BOTH running for the app to work!

## Sharing With Others

1. **Share the whole project:**
   - Send them the entire `neuronote/` folder
   - Include `data/notes.json` if you want to share your notes
   - They run `npm install` then `npm start`

2. **Backup your notes:**
   - Simply copy `data/notes.json`
   - Or commit to git: `git add data/notes.json && git commit -m "Update notes"`

3. **Start fresh:**
   - Delete `data/notes.json`
   - Restart the app - it will create a new file with sample data

Enjoy! 🎉
