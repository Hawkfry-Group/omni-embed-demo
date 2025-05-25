# Omni Embed Demo

## What is this?

This is a simple web app built with Node.js and Next.js to demonstrate how Omni can be securely embedded for different users.

- **Node.js app**: Handles web pages, API routes, and running the app locally.
- **Omni SDK integration**: Securely generates unique analytics links for each user using the official Omni SDK. **All sensitive logic and secrets are kept server-side; only signed URLs are sent to the client.**

## How does it work?

- Switch between demo users and dashboards in the app.
- The server uses the Omni SDK to generate a unique, signed analytics link for each user and dashboard.
- The client receives only the signed URL and displays analytics in an iframe.

## What is standard Node/Next.js, and what is Omni-specific?

- **Standard Node/Next.js:**
  - Files like `next.config.js`, `tsconfig.json`, `postcss.config.js`, and the `pages` and `components` folders are part of the basic app setup.
  - The `api` folder inside `pages` is where server-side code (API routes) lives.
- **Omni-specific:**
  - `src/lib/omni-embed.ts`: Uses the Omni SDK to generate secure analytics links.
  - `src/components/OmniEmbed.tsx`: React component that displays analytics in the page.
  - `src/pages/api/embed-url.ts`: Server-side API route that generates signed embed URLs using the SDK wrapper.
  - Demo users and dashboards in `src/pages/index.tsx` let you switch between different people and content.

## What do I need to do?

If you just want to see it running, follow these steps:

1. **Clone and install**: Download the code and run `npm install` to get everything set up.
2. **Configure**: Copy `.env.example` to `.env` and add your Omni secret and organization name (see below).
3. **Enter content IDs and connection ID**: In `src/pages/index.tsx`, replace the placeholder values (`your-dashboard-id-here`, `your-workbook-id-here`, and `your-connection-id-here`) with your actual dashboard/workbook IDs and connection ID with the appropriate role.
4. **Run**: Start the app with `npm run dev` and open it in your browser.
5. **Try it out**: Switch between users and dashboards to see how the analytics change for each one.

You don't need to know how Node.js or Next.js works to use this demo. Just follow the steps above!

For more details, see the rest of this README or ask your technical team for help.

## 🎯 Key Concepts

This demo shows how to implement Omni embeds in a multi-user application:

1. **One embed URL per user** - Each user gets their own unique, signed URL
2. **Server-side URL generation** - Secrets are never exposed to the client
3. **User-specific permissions** - Pass user attributes for row-level security
4. **Authentication integration** - Generate embed URLs based on your app's auth

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone <your-repo-url>
cd embed-demo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Omni credentials (choose one domain type):
```env
# Your Omni embed secret (must be exactly 32 characters)
OMNI_SECRET=your-32-character-secret-here

# For standard embed domains (org.embed-omniapp.co)
OMNI_ORGANIZATION_NAME=your-org-name

# OR for vanity/custom domains (uncomment and set if using)
# OMNI_HOST=omni.yourdomain.com
```

4. Update content IDs in `src/pages/index.tsx`:
   - Replace `your-dashboard-id-here` with actual dashboard IDs
   - Replace `your-workbook-id-here` with actual workbook IDs

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
embed-demo/
├── src/
│   ├── pages/
│   │   ├── index.tsx          # Main demo with user switching
│   │   └── api/
│   │       ├── embed-url.ts   # Server endpoint for URL generation
│   │       └── test-env.ts    # Diagnostic endpoint
│   ├── components/
│   │   └── OmniEmbed.tsx      # React component for embeds
│   ├── lib/
│   │   └── omni-embed.ts      # SDK wrapper utilities
│   └── types/
│       └── omni.ts            # TypeScript types
```

## 🧩 How the Main Files Work Together

This section explains how the core files in this project interact to securely generate and display Omni analytics embeds for different users.

### File Responsibilities

| File | Purpose |
|------|---------|
| `src/types/omni.ts` | TypeScript types for user, config, and error objects. |
| `src/pages/index.tsx` | Main demo page for user/content selection. |
| `src/components/OmniEmbed.tsx` | React component that fetches a signed embed URL and displays analytics in an iframe. Handles loading and error states. |
| `src/pages/api/embed-url.ts` | **Server-side API route**. Receives user/config, validates, and calls the Omni SDK (via `omni-embed.ts`) to generate a signed URL. |
| `src/lib/omni-embed.ts` | Server-side utility that wraps the Omni SDK for generating signed embed URLs using your secret and environment variables. |
| `src/pages/_app.tsx` | Wraps all pages in a global error boundary for user-friendly error handling. |

### Data Flow

1. User visits the demo page (`index.tsx`).
2. User selects a user and a dashboard/workbook.
3. `OmniEmbed` receives the user/config, fetches a signed URL from `/api/embed-url`.
4. `/api/embed-url` validates the request, calls `generateEmbedUrl` (in `omni-embed.ts`), and returns the signed URL.
5. `OmniEmbed` displays the analytics in an iframe using the signed URL.
6. If anything fails, the error boundary from `_app.tsx` catches it and shows a friendly error message.

#### Diagram

```
[index.tsx] (user/config selection)
      |
      v
[OmniEmbed.tsx] (POST /api/embed-url with { config, user })
      |
      v
[api/embed-url.ts] (validates, calls generateEmbedUrl)
      |
      v
[omni-embed.ts] (uses Omni SDK + secrets to generate signed URL)
      |
      v
[api/embed-url.ts] (returns { url } to frontend)
      |
      v
[OmniEmbed.tsx] (renders iframe with signed URL)
```

### Why This Matters

- **Security:** All sensitive logic and secrets are kept server-side; only signed URLs are sent to the client.
- **Flexibility:** Easily switch users/content to see how permissions and data access change.
- **Type Safety:** TypeScript types ensure consistent, safe data handling.
- **User Experience:** Loading and error states are handled gracefully.

## 🔍 Troubleshooting

### Environment Validation
Use the diagnostic endpoint to check your configuration:
```bash
curl http://localhost:3000/api/test-env
```

### Common Issues

- **403 Forbidden / Signature Mismatch**
  - Ensure your secret is exactly 32 characters
  - Check that you're using the correct organization name
  - Verify the embed domain exists (org.embed-omniapp.co)

- **400 Bad Request / Invalid User Attributes**
  - Ensure user attributes match those configured in Omni
  - Remove any attributes not set up in your Omni instance

- **Content Not Found**
  - Verify the dashboard/workbook ID is correct
  - Ensure the content is shared properly in Omni

## 📚 Examples

This demo is self-contained. To mimic real users or groups, simply edit the `DEMO_USERS` array in `src/pages/index.tsx`:

```typescript
const DEMO_USERS: OmniUser[] = [
  {
    externalId: 'user-001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    attributes: {
      department: 'Sales',
      role: 'Manager',
      region: 'North America',
    },
  },
  // Add more users as needed
];
```

## 🧭 Using Your Own Navigation Bar for Omni Content

**Use case:**
You have your own navigation bar (sidebar, topbar, etc.) and want users to navigate Omni folders or content using your UI, not Omni's built-in navigation.

**How it works:**
- Render your navigation bar in your app, outside the Omni iframe.
- When a user clicks a folder or content in your nav, update the Omni embed config to show the desired folder/content using a content-discovery embed.
- (Optional) Use postMessage for advanced navigation inside the iframe.

**Example:**
```jsx
// Pseudocode for a sidebar nav that lets users pick folders
function App() {
  const [omniConfig, setOmniConfig] = useState({
    contentType: 'content-discovery',
    path: 'root', // Start at Hub
    // ...other config
  });

  function handleFolderClick(folderPath) {
    setOmniConfig(cfg => ({
      ...cfg,
      contentType: 'content-discovery',
      path: folderPath, // e.g., 'entity-folder' or a specific folder path
    }));
  }

  return (
    <div className="layout">
      <Sidebar onFolderClick={handleFolderClick} />
      <OmniEmbed config={omniConfig} user={currentUser} />
    </div>
  );
}
```
- Use `path: 'root'` for the Hub, `'my'` for My Content, or `'entity-folder'` for an entity folder.
- For advanced navigation (e.g., drill into dashboards), you can use the [postMessage API](https://docs.omni.co/docs/embed/external-embedding/customization-and-interactivity). 

## 📖 Resources

- [Omni Embed SDK Documentation](https://www.npmjs.com/package/@omni-co/embed)
- [Omni Documentation](https://docs.omni.co)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT 