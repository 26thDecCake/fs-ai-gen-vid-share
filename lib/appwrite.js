import { Client, Account, ID } from "react-native-appwrite";

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

export const createUser = () => {
  // Register User
  account.create(ID.unique(), "me@example.com", "password", "Jane Doe").then(
    function (response) {
      console.log(response);
    },
    function (error) {
      console.log(error);
    }
  );
};
