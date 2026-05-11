import axios from "axios";

const IMGBB_API_KEY = "178b9b48f73e3f03b2dc330592e825f4";

export class ImageService {
  /**
   * Uploads a base64 image or a buffer to ImgBB
   * @param {string} base64Data - Base64 encoded image string (with or without data prefix)
   * @returns {Promise<string>} - The direct link to the uploaded image
   */
  static async upload(base64Data) {
    try {
      // Remove data:image/...;base64, prefix if present
      const base64Content = base64Data.split(",").pop();

      const params = new URLSearchParams();
      params.append("key", IMGBB_API_KEY);
      params.append("image", base64Content);

      const response = await axios.post("https://api.imgbb.com/1/upload", params);

      if (response.data && response.data.success) {
        return response.data.data.url;
      } else {
        throw new Error("ImgBB upload failed");
      }
    } catch (error) {
      console.error("Image Upload Error:", error.response?.data || error.message);
      throw new Error("Failed to upload image to ImgBB");
    }
  }
}
