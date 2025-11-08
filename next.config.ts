const nextConfig = {
  // Configure the development server to use port 3000
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },
  // Note: Port configuration is typically done via environment variables or command line
  // We'll use the PORT environment variable when starting the app
};

export default nextConfig;