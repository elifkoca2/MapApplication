using MapApplication1.Repositories;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace MapApplication1.Services
{
    public class GenericService<T> : IGenericService<T> where T : class
    {
        private readonly IGenericRepository<T> _repository;

        public GenericService(IGenericRepository<T> repository)
        {
            _repository = repository;
        }

        public T GetById(int id)
        {
            return _repository.GetById(id);
        }

        public IEnumerable<T> GetAll()
        {
            return _repository.GetAll();
        }

        public IEnumerable<T> Find(Expression<Func<T, bool>> predicate)
        {
            return _repository.Find(predicate);
        }

        public T Add(T entity)
        {
            _repository.Add(entity);
            return entity;
        }

        public void Remove(T entity)
        {
            _repository.Remove(entity);
        }

        public T Update(T entity)
        {
            _repository.Update(entity);
            return entity;
        }
    }
}
