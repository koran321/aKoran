import { ImageService } from "../services/imageService.js";

export class UploadController {
  static async uploadImage(req, res) {
    try {
      const { image } = req.body; // Expecting base64 string
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const imageUrl = await ImageService.upload(image);
      res.json({ success: true, url: imageUrl, source: "ANTIGRAVITY_UPLOAD_V4" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
