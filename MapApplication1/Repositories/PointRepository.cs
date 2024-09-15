using MapApplication1.Data;

namespace MapApplication1.Repositories
{
    public class PointRepository : GenericRepository<Point>, IPointRepository
    {
        public PointRepository(AppDbContext context) : base(context)
        {
        }

        // Point'e özel metotların implementasyonları buraya eklenebilir
    }
}
