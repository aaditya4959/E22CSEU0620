// The users are already pre authorized so no need for authentication to be added!
import axios from "axios";
import express from "express"



const PORT = process.env.PORT || 8080;
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNzQ0MDYxLCJpYXQiOjE3NDM3NDM3NjEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJiMmE5NzA3LTJhYzgtNDBlMS05Y2MzLTU3MjQwNDc5MWUyMyIsInN1YiI6ImUyMmNzZXUwNjIwQGJlbm5ldHQuZWR1LmluIn0sImVtYWlsIjoiZTIyY3NldTA2MjBAYmVubmV0dC5lZHUuaW4iLCJuYW1lIjoiYWFkaXR5YSBiaXIgc2luZ2giLCJyb2xsTm8iOiJlMjJjc2V1MDYyMCIsImFjY2Vzc0NvZGUiOiJydENIWkoiLCJjbGllbnRJRCI6ImJiMmE5NzA3LTJhYzgtNDBlMS05Y2MzLTU3MjQwNDc5MWUyMyIsImNsaWVudFNlY3JldCI6Im5EZ1hFZ1hSdlVQc2ZOdGoifQ.d1sE-qMRyjl7wuzQe5PKHWnaV3npXvQQInJf0qVna6M";
const BASE_URL  = "http://20.244.56.144/evaluation-service";


const app = express();

app.use(express.json());


//helper function for getting post counts
async function getPostCount(userId: string){
    try{
        const response = await axios.get(`${BASE_URL}/${userId}/posts`,{
            headers:{
                Authorization:`Bearer ${JWT_TOKEN}`
            }
        });
        return response.data.posts.length;
    }catch(err){
        console.error("Error while fething the posts");
        return 0;
    }
}


// end point for gettting the top 5 user with highest number of posts.
app.get("/users",async  (req, res) => {
    try{
        const userResponse = await axios.get(`${BASE_URL}/users`,{
            headers:{
                Authorization:`Bearer ${JWT_TOKEN}`
            }
        });
        
        const usersArray = Object.entries(userResponse.data.users).map(([id, name]) => ({
            id,
            name
        }));


        // fetching the post count here using the helpre funciton
        const userWithPosts = await Promise.all(
            usersArray.map(async (user) =>({
                ...user,
                postCount: await getPostCount(user.id)
            }))
        );

        // Sorting will happen here
        const topUsers = userWithPosts.sort((a,b) => b.postCount - a.postCount).slice(0,5);

        res.json(topUsers);
    }
    catch(err){
        res.status(500).json({
            "message":`Error in getting the user ${err}`
        })
    }
})


// Function to fetch all posts
const fetchPosts = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/posts`, {
            headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        });
        return response.data.posts || [];
    } catch (error: any) {
        console.error("Error fetching posts:", error.message);
        return [];
    }
};

// Function to fetch comments for a given post ID
const fetchComments = async (postId: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        });
        return response.data.comments || [];
    } catch (error:any) {
        console.error(`Error fetching comments for post ${postId}:`, error.message);
        return [];
    }
};

// Endpoint to get latest or popular posts
//@ts-ignore
app.get("/posts", async(req, res) => {
    try{
        const { type} = req.query;

        // Validate query param
        if (  !type || (type !== "latest" && type !== "popular")) {
          return res.status(400).json({ error: "Invalid type. Use 'latest' or 'popular'." });
        }

        // Fetch posts
        let posts = await fetchPosts();

        if (posts.length===0) {
            return res.json([]);
        }

        if (  type === "latest" )  {
            // Sort by createdAt timestamp (newest first) and get top 5
            //@ts-ignore
            posts =posts.sort((a: any, b: any) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        } else if(type === "popular") {
            // Fetch comment counts for each post
            for (  let post of posts ) {
               post.comments = await fetchComments(post.id);
            }
            // Find max comment count
            //@ts-ignore
            const maxComments = Math.max(...posts.map(post => post.comments.length));
            //@ts-ignore
            posts = posts.filter(post => post.comments.length === maxComments);
        }

        res.json(posts);
    } catch(error:any) {
        console.error("Error handling /posts request:", error.message);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})

