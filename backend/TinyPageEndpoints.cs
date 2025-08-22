using System.Data;
using TinyHind;

public static class TinyPageEndpoints
{
    public static void MapPageEndpoints(this IEndpointRouteBuilder app)
    {
        var pageGroup = app.MapGroup("/pages");

        // This is the HTMX endpoint, moved to its correct home.
        pageGroup.MapGet("/hello", async (ComponentRenderer renderer) =>
        {
            var parameters = new Dictionary<string, object?>
            {
                { "Message", "This was rendered from a Minimal API!" }
            };
            var html = await renderer.RenderComponent<Hello>(parameters);
            return Results.Content(html, "text/html");
        });
        
        // Future endpoints that return HTML fragments will go here.
    }
}