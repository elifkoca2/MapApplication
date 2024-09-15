using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace MapApplication1.Services
{
    public interface IGenericService<T> where T : class
    {
        T GetById(int id);
        IEnumerable<T> GetAll();
        IEnumerable<T> Find(Expression<Func<T, bool>> predicate);
        T Add(T entity);
        void Remove(T entity);
        T Update(T entity);
    }
}