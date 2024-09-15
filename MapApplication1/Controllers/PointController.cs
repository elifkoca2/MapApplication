using Microsoft.AspNetCore.Mvc;
using MapApplication1.Services;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace MapApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointController : ControllerBase
    {
        private readonly IPointService _pointService;
        public PointController(IPointService pointService)
        {
            _pointService = pointService;
        }

        [HttpGet]
        public ActionResult<List<Point>> GetAll()
        {
            var response = _pointService.GetAll();
            return Ok(response);
        }

        [HttpPost]
        public ActionResult<Point> Add(Point point)
        {
            try
            {
                var response = _pointService.AddPoint(point); // Burada AddPoint metodunu çağırıyoruz
                return Ok(new { message = "Başarıyla kaydedildi", data = response });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "İşlem başarısız", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public ActionResult<Point> GetById(int id)
        {
            var response = _pointService.GetById(id);
            if (response == null)
            {
                return NotFound();
            }
            return Ok(response);
        }

        [HttpPut("{id}")]
        public ActionResult<Point> Update(int id, Point point)
        {
            var response = _pointService.UpdatePoint(id, point); // Burada UpdatePoint metodunu çağırıyoruz
            if (response == null)
            {
                return NotFound(new { message = "İşlem başarısız" });
            }
            return Ok(new { message = "Başarıyla güncellendi", data = response });
        }

        [HttpDelete("{id}")]
        public ActionResult<Point> Delete(int id)
        {
            var point = _pointService.DeletePoint(id); 
            if (point == null)
            {
                return NotFound(new { message = "İşlem başarısız" });
            }
            return Ok(new { message = "Başarıyla silindi" });
        }
    }
}
