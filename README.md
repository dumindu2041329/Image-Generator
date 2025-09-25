# 🎨 Free AI Image Generator

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

A modern, responsive, and completely free AI image generator built with React and Vite. Transform your text prompts into stunning visuals with no API keys, no limits, and no costs. Features optional user authentication with Supabase to save and manage your creations.

![AI Image Generator Screenshot](https://i.ibb.co/67X3xfS/Screenshot-2024-05-23-at-12-05-39-PM.png)

## 🔗 Links

-   **Live Demo (Vercel):** https://image-generator-silk-mu.vercel.app/
-   **GitHub Repository:** https://github.com/dumindu2041329/Image-Generator

## ✨ Key Features

-   **🚀 100% Free & Unlimited:** Powered by the free [Pollinations AI](https://pollinations.ai/), generate as many images as you want without any cost.
-   **🔑 No API Keys Required:** Start generating immediately without any complex setup or API key management.
-   **🎨 Customizable Generation:**
    -   **Styles:** Choose between `Vivid` for dramatic, colorful images or `Natural` for a more realistic look.
    -   **Aspect Ratios:** Supports `1:1` (Square), `16:9` (Landscape), and `4:3` (Classic) formats.
-   **👤 Optional User Authentication:**
    -   Connect your own Supabase project to enable user sign-up and sign-in.
    -   Authenticated users can save their generated images to a personal, persistent history.
-   **🖼️ Image History & Favorites:**
    -   View all your saved images in a beautiful, searchable history panel.
    -   Mark your favorite creations for easy access.
-   **💾 Download & Copy:** Easily download your generated images or copy the prompt to reuse it.
-   **📱 Fully Responsive:** A sleek, modern UI that works beautifully on desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

-   **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Backend (BaaS):** [Supabase](https://supabase.com/) for Authentication and Storage
-   **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
-   **Image Generation API:** [Pollinations AI](https://pollinations.ai/)

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or higher)
-   [Yarn](https://yarnpkg.com/) (v1.22 or higher)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/image-generator.git
cd image-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase (Optional but Recommended)

To enable user authentication and image saving, you'll need a Supabase project.

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Get API Credentials:** In your project dashboard, go to **Project Settings > API** and find your Project URL and `anon` public key.
3.  **Set Up Database Schema:**
    -   Go to the **SQL Editor** in your Supabase dashboard.
    -   Copy the contents of `src/sql/schema.sql` and run it to create the necessary tables and policies.
    -   For profile image functionality, also run `src/sql/03_add_profile_images_bucket.sql` to create the profile images storage bucket.
4.  **Set Up Storage:**
    -   Go to the **Storage** section.
    -   Create a new bucket named `generated_images`.
    -   Create a new bucket named `profile_images` (or run the SQL script from step 3).
    -   Set both buckets to be **public**.
    -   Configure the bucket access policies to allow authenticated users to upload, select, update, and delete their own files.

### 4. Configure Environment Variables

Create a `.env` file in the root of the project and add your Supabase credentials:

```env
# .env

# Supabase Configuration
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

If you skip the Supabase setup, the app will still work, but authentication and history features will be disabled.

### 5. Run the Development Server

```bash
npm run dev
```

The application should now be running on `http://localhost:5173`.

## ☁️ Deployment

This project is ready to be deployed on services like Netlify, Vercel, or GitHub Pages.

### Deploying to Netlify

1.  Push your code to a GitHub repository.
2.  Create a new site on Netlify and connect it to your repository.
3.  Configure the build settings:
    -   **Build command:** `yarn build`
    -   **Publish directory:** `dist`
4.  Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Netlify site settings under **Site configuration > Environment variables**.
5.  Deploy the site!

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or find a bug, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
