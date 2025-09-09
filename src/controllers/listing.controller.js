import Listing from "../models/listing.schema.js";

export async function getListings(req, res) {
  const docs = await Listing.find().populate("owner", "username email");
  res.json(docs);
}

export async function getListingById(req, res) {
  const { id } = req.params;
  const doc = await Listing.findById(id).populate("owner", "username email");
  if (!doc) return res.status(404).json({ message: "Listing not found" });
  res.json(doc);
}

export async function createListing(req, res) {
  const { title, images, type, description, location } = req.body;
  if (!title || !type)
    return res.status(400).json({ message: "Champs requis manquants" });

  const payload = {
    title,
    images: Array.isArray(images) ? images : images ? [images] : [],
    type,
    description: description || null,
    location: location || {},
    owner: req.user._id,
  };

  const created = await Listing.create(payload);
  res.status(201).json(created);
}

export async function updateListing(req, res) {
  const { id } = req.params;
  const existing = await Listing.findById(id);
  if (!existing) return res.status(404).json({ message: "Listing not found" });

  const userId = req.user?._id?.toString();
  const ownerId = existing.owner?.toString();
  if (userId !== ownerId && req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Accès interdit : pas le propriétaire" });
  }

  const updated = await Listing.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
}

export async function deleteListing(req, res) {
  const { id } = req.params;
  const existing = await Listing.findById(id);
  if (!existing) return res.status(404).json({ message: "Listing not found" });

  const userId = req.user?._id?.toString();
  const ownerId = existing.owner?.toString();
  if (userId !== ownerId && req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Accès interdit : pas le propriétaire" });
  }

  await existing.remove();
  res.json({ message: "Listing deleted" });
}
