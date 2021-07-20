export default {
    data: {
        nodes: [
            {
                id: "0",
                shape: "bizFlowStartNode",
                label: "bizFlowStartNode",
                x: 50,
                y: 50,
                values: { name: "bizFlowStartNode" }
            },
            {
                id: "1",
                shape: "bizFlowNode",
                label: "bizFlowNode",
                fill: "blue",

                x: 100,
                y: 100,
                values: { name: "bizFlowNode" }
            },
            {
                id: "2",
                shape: "bizFlowEndNode",
                label: "bizFlowEndNode",
                x: 150,
                y: 150,
                values: { name: "bizFlowEndNodes" }
            }
        ],

        edges: [
            {
                label: "edge1",
                source: "0",
                target: "1",
                values: { name: "edge1" }
            },
            {
                label: "edge2",
                source: "1",
                target: "2",
                values: { name: "edge2" }
            }
        ]
    }
}
