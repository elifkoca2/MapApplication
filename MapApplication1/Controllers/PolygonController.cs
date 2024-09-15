using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using MapApplication1.Data;
using Microsoft.EntityFrameworkCore;

namespace MapApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PolygonController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PolygonController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<IEnumerable<MapPolygon>> GetPolygons()
        {
            return _context.Polygons.ToList();
        }

        [HttpGet("{id}")]
        public ActionResult<MapPolygon> GetPolygon(int id)
        {
            var polygon = _context.Polygons.Find(id);
            if (polygon == null)
            {
                return NotFound();
            }

            return polygon;
        }

        [HttpPost]
        public ActionResult<MapPolygon> CreatePolygon(MapPolygon polygon)
        {
            _context.Polygons.Add(polygon);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetPolygon), new { id = polygon.Id }, polygon);
        }

        [HttpPut("{id}")]
        public IActionResult UpdatePolygon(int id, MapPolygon polygon)
        {
            if (id != polygon.Id)
            {
                return BadRequest();
            }

            _context.Entry(polygon).State = EntityState.Modified;
            _context.SaveChanges();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeletePolygon(int id)
        {
            var polygon = _context.Polygons.Find(id);
            if (polygon == null)
            {
                return NotFound();
            }

            _context.Polygons.Remove(polygon);
            _context.SaveChanges();

            return NoContent();
        }
    }
}
