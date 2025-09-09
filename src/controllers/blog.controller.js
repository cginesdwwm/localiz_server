import Blog from "../models/blog.schema.js";

// Créer un blog
export const createBlog = async (req, res) => {
  console.log(req);
  try {
    const { title, content, image } = req.body;
    const blog = await Blog.create({
      title,
      content,
      image, // URL Supabase
      author: req.user._id, // récupéré via middleware
    });
    res.status(201).json(blog);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });
    /*
     * C'est une requête asynchrone pour interroger la base de données.
     * `Blog.find()` : Trouve tous les documents de la collection 'Blog' sans filtre.
     * `.populate(...)` : C'est le point clé. Mongoose va remplacer l'ObjectId de l'auteur par les données de l'utilisateur.
     * `("author", "username email")` : Spécifie que c'est le champ `author` qui est à "populer" et que l'on veut seulement récupérer les champs `username` et `email` de l'utilisateur, ce qui est une bonne pratique pour ne pas exposer des informations sensibles comme le mot de passe.
     * `await` : Attend que la requête à la base de données soit terminée avant de continuer l'exécution du code. Le résultat (tous les blogs avec les informations de leurs auteurs) est stocké dans la variable `blogs`.
     */
    console.log(blogs);
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
