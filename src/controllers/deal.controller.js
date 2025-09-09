import Deal from "../models/deal.schema.js";

export async function getDeals(req, res) {
  const docs = await Deal.find().populate("author", "username email");
  res.json(docs);
}

export async function getDealById(req, res) {
  const { id } = req.params;
  const doc = await Deal.findById(id).populate("author", "username email");
  if (!doc) return res.status(404).json({ message: "Deal not found" });
  res.json(doc);
}

export async function createDeal(req, res) {
  const {
    image,
    title,
    startDate,
    endDate,
    description,
    location,
    accessConditions,
    website,
    tags,
  } = req.body;

  // Validation minimale côté serveur
  if (!image || !title || !startDate || !description) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }

  const payload = {
    image,
    title,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    location: location || {},
    accessConditions: accessConditions || null,
    website: website || null,
    tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    author: req.user._id,
    description,
  };

  const created = await Deal.create(payload);
  res.status(201).json(created);
}

export async function updateDeal(req, res) {
  const { id } = req.params;
  const updateData = { ...req.body };
  if (updateData.startDate)
    updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  if (updateData.tags && !Array.isArray(updateData.tags))
    updateData.tags = [updateData.tags];

  // Vérifier existence
  const existing = await Deal.findById(id);
  if (!existing) return res.status(404).json({ message: "Deal not found" });

  // Autoriser seulement l'auteur ou un admin
  const userId = req.user?._id?.toString();
  const authorId = existing.author?.toString();
  if (userId !== authorId && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès interdit : pas l'auteur" });
  }

  const updated = await Deal.findByIdAndUpdate(id, updateData, { new: true });
  res.json(updated);
}

export async function deleteDeal(req, res) {
  const { id } = req.params;
  const existing = await Deal.findById(id);
  if (!existing) return res.status(404).json({ message: "Deal not found" });

  const userId = req.user?._id?.toString();
  const authorId = existing.author?.toString();
  if (userId !== authorId && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès interdit : pas l'auteur" });
  }

  await existing.remove();
  res.json({ message: "Deal deleted" });
}
