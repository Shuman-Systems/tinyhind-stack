using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.Extensions.Logging;

public class ComponentRenderer
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILoggerFactory _loggerFactory;

    public ComponentRenderer(IServiceProvider serviceProvider, ILoggerFactory loggerFactory)
    {
        _serviceProvider = serviceProvider;
        _loggerFactory = loggerFactory;
    }

    public async Task<string> RenderComponent<T>(Dictionary<string, object?> parameters) where T : IComponent
    {
        await using var htmlRenderer = new HtmlRenderer(_serviceProvider, _loggerFactory);

        var htmlContent = await htmlRenderer.Dispatcher.InvokeAsync(async () =>
        {
            var parameterView = ParameterView.FromDictionary(parameters);
            var output = await htmlRenderer.RenderComponentAsync<T>(parameterView);
            return output.ToHtmlString();
        });

        return htmlContent;
    }
}