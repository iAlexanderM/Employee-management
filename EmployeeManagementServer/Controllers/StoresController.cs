using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Добавляем авторизацию
    public class StoresController : ControllerBase
    {
        private readonly IStoreService _storeService;
        private readonly IMapper _mapper;

        public StoresController(IStoreService storeService, IMapper mapper)
        {
            _storeService = storeService;
            _mapper = mapper;
        }

        // GET: api/Stores
        [HttpGet]
        public async Task<IActionResult> GetStores()
        {
            var stores = await _storeService.GetAllStoresAsync();
            return Ok(stores);
        }

        // GET: api/Stores/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStore(int id)
        {
            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null)
            {
                return NotFound();
            }

            return Ok(store);
        }

        // POST: api/Stores
        [HttpPost]
        public async Task<IActionResult> CreateStore([FromBody] StoreDto storeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var store = _mapper.Map<Store>(storeDto);
            await _storeService.AddStoreAsync(store);
            return CreatedAtAction(nameof(GetStore), new { id = store.Id }, store);
        }

        // PUT: api/Stores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStore(int id, [FromBody] StoreDto storeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null)
            {
                return NotFound();
            }

            _mapper.Map(storeDto, store);
            await _storeService.UpdateStoreAsync(store);
            return NoContent();
        }

        // DELETE: api/Stores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStore(int id)
        {
            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null)
            {
                return NotFound();
            }

            await _storeService.ArchiveStoreAsync(store);
            return NoContent();
        }
    }
}
