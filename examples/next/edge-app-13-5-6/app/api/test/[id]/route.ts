import { baseEntity, generateResponse } from "../../utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    const data = {
        ...baseEntity,
        requestData: {
            id,
        }
    };

    return generateResponse(data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    const json = await request.json();

    const data = {
        ...baseEntity,
        requestData: {
            id,
            body: json,
        }
    }
    
    return generateResponse(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    const json = await request.json();

    const data = {
        ...baseEntity,
        requestData: {
            id,
            body: json,
        }
    }
    
    return generateResponse(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    const data = {
        ...baseEntity,
        requestData: {
            id,
        }
    }
    
    return generateResponse(data);
}

export const runtime = 'edge';