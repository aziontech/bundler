const baseEntity = {
    name: "foo",
    description: "bar",
};

function generateResponse(data: any) {
    return new Response(
        JSON.stringify(data),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
}


export { baseEntity, generateResponse }