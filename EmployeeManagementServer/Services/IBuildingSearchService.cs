﻿using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IBuildingSearchService
    {
        Task<List<Building>> SearchBuildingsAsync(BuildingSearchDto searchDto);
    }
}