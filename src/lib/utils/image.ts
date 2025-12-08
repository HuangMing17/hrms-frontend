export const getImageUrl = (imagePath?: string | null): string => {
    if (!imagePath) {
        return "";
    }

    // Data URLs or already absolute paths
    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    if (!baseUrl) {
        return normalizedPath;
    }

    return `${baseUrl}${normalizedPath}`;
};


