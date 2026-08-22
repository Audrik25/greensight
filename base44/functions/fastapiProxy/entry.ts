const BASE_URL = "https://greensight-16eq.onrender.com";

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "health";

    // POST /api/analyze — image analysis via multipart/form-data
    if (action === "analyze") {
      const fileUrl = body.file_url;
      if (!fileUrl) return Response.json({ error: "file_url is required" }, { status: 400 });

      const imgRes = await fetch(fileUrl);
      if (!imgRes.ok) return Response.json({ error: "Failed to fetch image from file_url" }, { status: 502 });
      const blob = await imgRes.blob();

      const formData = new FormData();
      formData.append("file", blob, "upload.jpg");

      const apiRes = await fetch(`${BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });
      const data = await apiRes.json().catch(() => ({}));
      return Response.json(data, { status: apiRes.status });
    }

    // POST /api/capture — tell the Raspberry Pi to take a new photo now
    if (action === "capture") {
      const apiRes = await fetch(`${BASE_URL}/api/capture`, {
        method: "POST",
        headers: { "Accept": "application/json" },
      });
      const data = await apiRes.json().catch(() => ({}));
      if (data?.capture?.image_url && data.capture.image_url.startsWith("/")) {
        data.capture.image_url = `${BASE_URL}${data.capture.image_url}`;
      }
      return Response.json(data, { status: apiRes.status });
    }

    // GET endpoints
    const endpoint = action === "latest-status" ? "/api/latest-status" : "/api/health";
    const apiRes = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Accept": "application/json" },
    });
    const data = await apiRes.json().catch(() => ({}));

    // Prefix any relative image URLs (e.g. /uploads/...) with the backend base URL
    // so the frontend can render Raspberry Pi captures directly.
    if (action === "latest-status" && data?.capture?.image_url) {
      const imgUrl = data.capture.image_url;
      if (imgUrl.startsWith("/")) {
        data.capture.image_url = `${BASE_URL}${imgUrl}`;
      }
    }
    return Response.json(data, { status: apiRes.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}