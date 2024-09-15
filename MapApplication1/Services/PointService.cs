using MapApplication1.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace MapApplication1.Services
{
    public class PointService : IPointService
    {
        private readonly AppDbContext _context;

        public PointService(AppDbContext context)
        {
            _context = context;
        }

        public Point AddPoint(Point point)
        {
            // Eğer aynı ID'ye sahip bir nokta varsa, hata fırlat
            if (_context.Points.Any(p => p.Id == point.Id))
            {
                throw new InvalidOperationException($"A Point with Id {point.Id} already exists.");
            }

            // Yeni noktayı ekle ve değişiklikleri kaydet
            _context.Points.Add(point);
            _context.SaveChanges();
            return point;
        }

        public Point DeletePoint(int id)
        {
            var point = _context.Points.Find(id);
            if (point != null)
            {
                _context.Points.Remove(point);
                _context.SaveChanges();
            }
            return point;
        }

        public List<Point> GetAll()
        {
            return _context.Points.ToList();
        }

        public List<Point> GetAllPoints()
        {
            throw new NotImplementedException();
        }

        public Point GetById(int id)
        {
            return _context.Points.FirstOrDefault(p => p.Id == id);
        }

        public List<Point> GetPointsById(int id)
        {
            return _context.Points.Where(p => p.Id == id).ToList();
        }

        public Point UpdatePoint(int id, Point point)
        {
            var existingPoint = _context.Points.FirstOrDefault(p => p.Id == id);
            if (existingPoint != null)
            {
                existingPoint.X = point.X;
                existingPoint.Y = point.Y;
                existingPoint.Name = point.Name;

                _context.Entry(existingPoint).State = EntityState.Modified;
                _context.SaveChanges();
                return existingPoint;
            }
            return null;
        }
    }
}
