import fetchQueue from "./queue";

export async function makeGetRequest(path: string) {
    try {
        const response = await fetchQueue(path, {
            method: 'GET',
        });
        return response;
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function makePostRequest(path: string, body: String) {
    try {
        const response = await fetchQueue(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });
        return response;
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function parseServerResponse(response: Response) {
    try {
        if (!response || !response.ok) {
            return "Sorry, I'm not feeling well today. Try again later.";
        }
        const data = await response.json();
        // console.log("data: ", data)
        if (data.error) {
            return data.error;
        }
        return data.result;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm not feeling well today. Try again later.";
    }
}