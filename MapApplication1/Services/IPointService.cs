using System.Collections.Generic;

namespace MapApplication1.Services
{
    public interface IPointService
    {
        List<Point> GetAll();
        List<Point> GetAllPoints();
        Point AddPoint(Point point);
        Point GetById(int id);
        List<Point> GetPointsById(int id);
        Point DeletePoint(int id);
        Point UpdatePoint(int id, Point point);
    }
}
