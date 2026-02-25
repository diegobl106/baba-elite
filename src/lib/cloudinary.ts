// src/lib/cloudinary.ts
export async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary não configurado no .env.local")
  }

  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", uploadPreset)
  // opcional: coloca numa pasta
  form.append("folder", "baba-elite")

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error("Falha ao enviar imagem: " + txt)
  }

  const data = await res.json()
  // url pública
  return data.secure_url as string
}