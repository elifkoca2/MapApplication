using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MapApplication1.Services;
using MapApplication1.Data;
using Microsoft.EntityFrameworkCore;
using MapApplication1.Repositories;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


// Register repositories
builder.Services.AddScoped<IPointRepository, PointRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();


// Register services
builder.Services.AddScoped<IPointService, PointService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Yeni statik dosya klasörünü yapýlandýrma
var staticFilesPath = Path.Combine(Directory.GetCurrentDirectory(), "static");
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(staticFilesPath),
    RequestPath = "/static"
});


app.UseAuthorization();

app.MapControllers();

app.Run();
