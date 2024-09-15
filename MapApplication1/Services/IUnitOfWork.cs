using System;

namespace MapApplication1.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IPointRepository Points { get; }
        int Complete();
    }
}
