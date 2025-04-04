"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The users are already pre authorized so no need for authentication to be added!
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const PORT = process.env.PORT || 8080;
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNzQ0MDYxLCJpYXQiOjE3NDM3NDM3NjEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJiMmE5NzA3LTJhYzgtNDBlMS05Y2MzLTU3MjQwNDc5MWUyMyIsInN1YiI6ImUyMmNzZXUwNjIwQGJlbm5ldHQuZWR1LmluIn0sImVtYWlsIjoiZTIyY3NldTA2MjBAYmVubmV0dC5lZHUuaW4iLCJuYW1lIjoiYWFkaXR5YSBiaXIgc2luZ2giLCJyb2xsTm8iOiJlMjJjc2V1MDYyMCIsImFjY2Vzc0NvZGUiOiJydENIWkoiLCJjbGllbnRJRCI6ImJiMmE5NzA3LTJhYzgtNDBlMS05Y2MzLTU3MjQwNDc5MWUyMyIsImNsaWVudFNlY3JldCI6Im5EZ1hFZ1hSdlVQc2ZOdGoifQ.d1sE-qMRyjl7wuzQe5PKHWnaV3npXvQQInJf0qVna6M";
const BASE_URL = "http://20.244.56.144/evaluation-service/users";
const app = (0, express_1.default)();
//helper function for getting post counts
function getPostCount(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`${BASE_URL}/${userId}/posts`, {
                headers: {
                    Authorization: `Bearer ${JWT_TOKEN}`
                }
            });
            return response.data.posts.length;
        }
        catch (err) {
            console.error("Error while fething the posts");
            return 0;
        }
    });
}
// end point for gettting the top 5 user with highest number of posts.
app.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userResponse = yield axios_1.default.get(`${BASE_URL}`, {
            headers: {
                Authorization: `Bearer ${JWT_TOKEN}`
            }
        });
        const usersArray = Object.entries(userResponse.data.users).map(([id, name]) => ({
            id,
            name
        }));
        // fetching the post count here using the helpre funciton
        const userWithPosts = yield Promise.all(usersArray.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            return (Object.assign(Object.assign({}, user), { postCount: yield getPostCount(user.id) }));
        })));
        // Sorting will happen here
        const topUsers = userWithPosts.sort((a, b) => b.postCount - a.postCount).slice(0, 5);
        res.json(topUsers);
    }
    catch (err) {
        res.status(500).json({
            "message": `Error in getting the user ${err}`
        });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
