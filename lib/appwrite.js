import {
  Client,
  Account,
  ID,
  Avatars,
  Databases,
  Storage,
  Query,
} from "react-native-appwrite";

export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.rthan.ocea",
  projectId: "6663086f002cffe45fcc",
  databaseId: "66630aad0039375ce005",
  userCollectionId: "66630acc0030aff0e620",
  videoCollectionId: "66630ae6002b7de7bc5c",
  storageId: "66630c3e002ad64636d0",
};

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(config.endpoint) // Your Appwrite Endpoint
  .setProject(config.projectId) // Your project ID
  .setPlatform(config.platform); // Your application ID or bundle ID.

// Init your Account
const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

/**
 * Creates a new user account with the provided email, password, and username.
 *
 * @param {string} email - The email address of the user.
 * @param {string} password - The password for the user.
 * @param {string} username - The username for the user.
 * @return {Promise<void>} A promise that resolves when the user account is created successfully, or rejects with an error if the creation fails.
 * @throws {Error} If the user account creation fails.
 */
export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

/**
 * Signs in a user with the provided email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @return {Promise<object>} A promise that resolves to the session object if the sign-in is successful, or rejects with an error if the sign-in fails.
 */
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Retrieves the current user from the database based on the current account.
 *
 * @return {Promise<Object|null>} A promise that resolves to the current user object, or null if an error occurred.
 * @throws {Error} If the current account or the current user could not be retrieved.
 */
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Uploads a file to the storage service and retrieves the file preview URL.
 *
 * @param {File} file - The file to be uploaded.
 * @param {string} type - The type of the file (e.g., "image", "video").
 * @return {Promise<string>} A promise that resolves to the file preview URL, or rejects with an error.
 * @throws {Error} If there was an error during the file upload or retrieving the file preview.
 */
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Retrieves the preview URL of a file based on its ID and type.
 *
 * @param {string} fileId - The ID of the file.
 * @param {string} type - The type of the file ("video" or "image").
 * @return {Promise<string>} A promise that resolves to the preview URL of the file.
 * @throws {Error} If the file type is invalid or if there was an error retrieving the preview URL.
 */
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Creates a new video post.
 *
 * @param {Object} form - The form data for the video post.
 * @param {File} form.thumbnail - The thumbnail file for the video post.
 * @param {File} form.video - The video file for the video post.
 * @param {string} form.title - The title of the video post.
 * @param {string} form.prompt - The prompt for the video post.
 * @param {string} form.userId - The ID of the user creating the video post.
 * @return {Promise<Object>} A promise that resolves to the newly created video post.
 * @throws {Error} If there is an error during the creation of the video post.
 */
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
