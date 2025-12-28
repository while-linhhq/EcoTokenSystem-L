using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class ConfigService : IConfigInterface
    {
        private readonly ApplicationDbContext dbContext;

        public ConfigService(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<ResponseDTO<ConfigDTO>> GetConfigAsync()
        {
            try
            {
                var configs = await dbContext.Configs.ToListAsync();
                var configDto = new ConfigDTO();

                // Parse GiftPrices
                var giftPricesConfig = configs.FirstOrDefault(c => c.Key == "GiftPrices");
                if (giftPricesConfig != null && !string.IsNullOrEmpty(giftPricesConfig.Value))
                {
                    try
                    {
                        configDto.GiftPrices = JsonSerializer.Deserialize<Dictionary<string, int>>(giftPricesConfig.Value) 
                            ?? new Dictionary<string, int>();
                    }
                    catch
                    {
                        configDto.GiftPrices = new Dictionary<string, int>();
                    }
                }

                // Parse StreakMilestones
                var streakMilestonesConfig = configs.FirstOrDefault(c => c.Key == "StreakMilestones");
                if (streakMilestonesConfig != null && !string.IsNullOrEmpty(streakMilestonesConfig.Value))
                {
                    try
                    {
                        configDto.StreakMilestones = JsonSerializer.Deserialize<Dictionary<string, StreakMilestoneDTO>>(streakMilestonesConfig.Value)
                            ?? new Dictionary<string, StreakMilestoneDTO>();
                    }
                    catch
                    {
                        // Default values
                        configDto.StreakMilestones = new Dictionary<string, StreakMilestoneDTO>
                        {
                            { "50", new StreakMilestoneDTO { Color = "#4A90E2", Emoji = "🐢", Name = "Linh vật xanh dương" } },
                            { "100", new StreakMilestoneDTO { Color = "#FFD700", Emoji = "🌟", Name = "Linh vật vàng" } }
                        };
                    }
                }
                else
                {
                    // Default values if not found
                    configDto.StreakMilestones = new Dictionary<string, StreakMilestoneDTO>
                    {
                        { "50", new StreakMilestoneDTO { Color = "#4A90E2", Emoji = "🐢", Name = "Linh vật xanh dương" } },
                        { "100", new StreakMilestoneDTO { Color = "#FFD700", Emoji = "🌟", Name = "Linh vật vàng" } }
                    };
                }

                // Parse ActionRewards
                var actionRewardsConfig = configs.FirstOrDefault(c => c.Key == "ActionRewards");
                if (actionRewardsConfig != null && !string.IsNullOrEmpty(actionRewardsConfig.Value))
                {
                    try
                    {
                        configDto.ActionRewards = JsonSerializer.Deserialize<ActionRewardsDTO>(actionRewardsConfig.Value)
                            ?? new ActionRewardsDTO();
                    }
                    catch
                    {
                        // Default values
                        configDto.ActionRewards = new ActionRewardsDTO
                        {
                            Default = new ActionRewardDTO { Streak = 1, EcoTokens = 10 },
                            Tags = new Dictionary<string, ActionRewardDTO>
                            {
                                { "xe-dap", new ActionRewardDTO { Streak = 1, EcoTokens = 15 } },
                                { "mang-coc", new ActionRewardDTO { Streak = 1, EcoTokens = 12 } },
                                { "trong-cay", new ActionRewardDTO { Streak = 1, EcoTokens = 20 } },
                                { "phan-loai-rac", new ActionRewardDTO { Streak = 1, EcoTokens = 12 } },
                                { "binh-nuoc", new ActionRewardDTO { Streak = 1, EcoTokens = 10 } },
                                { "tui-vai", new ActionRewardDTO { Streak = 1, EcoTokens = 10 } }
                            }
                        };
                    }
                }
                else
                {
                    // Default values if not found
                    configDto.ActionRewards = new ActionRewardsDTO
                    {
                        Default = new ActionRewardDTO { Streak = 1, EcoTokens = 10 },
                        Tags = new Dictionary<string, ActionRewardDTO>
                        {
                            { "xe-dap", new ActionRewardDTO { Streak = 1, EcoTokens = 15 } },
                            { "mang-coc", new ActionRewardDTO { Streak = 1, EcoTokens = 12 } },
                            { "trong-cay", new ActionRewardDTO { Streak = 1, EcoTokens = 20 } },
                            { "phan-loai-rac", new ActionRewardDTO { Streak = 1, EcoTokens = 12 } },
                            { "binh-nuoc", new ActionRewardDTO { Streak = 1, EcoTokens = 10 } },
                            { "tui-vai", new ActionRewardDTO { Streak = 1, EcoTokens = 10 } }
                        }
                    };
                }

                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = true,
                    Message = "Lấy cấu hình thành công",
                    Data = configDto
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy cấu hình: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }

        public async Task<ResponseDTO<ConfigDTO>> UpdateGiftPriceAsync(string giftId, int price)
        {
            try
            {
                var giftPricesConfig = await dbContext.Configs.FirstOrDefaultAsync(c => c.Key == "GiftPrices");
                
                Dictionary<string, int> giftPrices;
                if (giftPricesConfig != null && !string.IsNullOrEmpty(giftPricesConfig.Value))
                {
                    try
                    {
                        giftPrices = JsonSerializer.Deserialize<Dictionary<string, int>>(giftPricesConfig.Value)
                            ?? new Dictionary<string, int>();
                    }
                    catch
                    {
                        giftPrices = new Dictionary<string, int>();
                    }
                }
                else
                {
                    giftPrices = new Dictionary<string, int>();
                    if (giftPricesConfig == null)
                    {
                        giftPricesConfig = new Config
                        {
                            Id = Guid.NewGuid(),
                            Key = "GiftPrices",
                            Value = "{}",
                            UpdatedAt = DateTime.UtcNow
                        };
                        dbContext.Configs.Add(giftPricesConfig);
                    }
                }

                giftPrices[giftId] = price;
                giftPricesConfig.Value = JsonSerializer.Serialize(giftPrices);
                giftPricesConfig.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // Return updated config
                return await GetConfigAsync();
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi cập nhật giá quà: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }

        public async Task<ResponseDTO<ConfigDTO>> UpdateStreakMilestoneAsync(string streak, StreakMilestoneDTO milestone)
        {
            try
            {
                var streakMilestonesConfig = await dbContext.Configs.FirstOrDefaultAsync(c => c.Key == "StreakMilestones");
                
                Dictionary<string, StreakMilestoneDTO> streakMilestones;
                if (streakMilestonesConfig != null && !string.IsNullOrEmpty(streakMilestonesConfig.Value))
                {
                    try
                    {
                        streakMilestones = JsonSerializer.Deserialize<Dictionary<string, StreakMilestoneDTO>>(streakMilestonesConfig.Value)
                            ?? new Dictionary<string, StreakMilestoneDTO>();
                    }
                    catch
                    {
                        streakMilestones = new Dictionary<string, StreakMilestoneDTO>();
                    }
                }
                else
                {
                    streakMilestones = new Dictionary<string, StreakMilestoneDTO>();
                    if (streakMilestonesConfig == null)
                    {
                        streakMilestonesConfig = new Config
                        {
                            Id = Guid.NewGuid(),
                            Key = "StreakMilestones",
                            Value = "{}",
                            UpdatedAt = DateTime.UtcNow
                        };
                        dbContext.Configs.Add(streakMilestonesConfig);
                    }
                }

                streakMilestones[streak] = milestone;
                streakMilestonesConfig.Value = JsonSerializer.Serialize(streakMilestones);
                streakMilestonesConfig.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // Return updated config
                return await GetConfigAsync();
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi cập nhật milestone: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }

        public async Task<ResponseDTO<ConfigDTO>> UpdateActionRewardAsync(string? tag, ActionRewardDTO reward)
        {
            try
            {
                var actionRewardsConfig = await dbContext.Configs.FirstOrDefaultAsync(c => c.Key == "ActionRewards");
                
                ActionRewardsDTO actionRewards;
                if (actionRewardsConfig != null && !string.IsNullOrEmpty(actionRewardsConfig.Value))
                {
                    try
                    {
                        actionRewards = JsonSerializer.Deserialize<ActionRewardsDTO>(actionRewardsConfig.Value)
                            ?? new ActionRewardsDTO();
                    }
                    catch
                    {
                        actionRewards = new ActionRewardsDTO
                        {
                            Default = new ActionRewardDTO { Streak = 1, EcoTokens = 10 },
                            Tags = new Dictionary<string, ActionRewardDTO>()
                        };
                    }
                }
                else
                {
                    actionRewards = new ActionRewardsDTO
                    {
                        Default = new ActionRewardDTO { Streak = 1, EcoTokens = 10 },
                        Tags = new Dictionary<string, ActionRewardDTO>()
                    };
                    if (actionRewardsConfig == null)
                    {
                        actionRewardsConfig = new Config
                        {
                            Id = Guid.NewGuid(),
                            Key = "ActionRewards",
                            Value = "{}",
                            UpdatedAt = DateTime.UtcNow
                        };
                        dbContext.Configs.Add(actionRewardsConfig);
                    }
                }

                if (string.IsNullOrEmpty(tag))
                {
                    // Update default
                    actionRewards.Default = reward;
                }
                else
                {
                    // Update tag-specific reward
                    if (actionRewards.Tags == null)
                    {
                        actionRewards.Tags = new Dictionary<string, ActionRewardDTO>();
                    }
                    actionRewards.Tags[tag] = reward;
                }

                actionRewardsConfig.Value = JsonSerializer.Serialize(actionRewards);
                actionRewardsConfig.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // Return updated config
                return await GetConfigAsync();
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi cập nhật phần thưởng: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }

        public async Task<ResponseDTO<ConfigDTO>> DeleteStreakMilestoneAsync(string streak)
        {
            try
            {
                var streakMilestonesConfig = await dbContext.Configs.FirstOrDefaultAsync(c => c.Key == "StreakMilestones");
                
                if (streakMilestonesConfig == null || string.IsNullOrEmpty(streakMilestonesConfig.Value))
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = "Không tìm thấy cấu hình Streak Milestones",
                        Data = new ConfigDTO()
                    };
                }

                Dictionary<string, StreakMilestoneDTO> streakMilestones;
                try
                {
                    streakMilestones = JsonSerializer.Deserialize<Dictionary<string, StreakMilestoneDTO>>(streakMilestonesConfig.Value)
                        ?? new Dictionary<string, StreakMilestoneDTO>();
                }
                catch
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = "Lỗi khi parse cấu hình Streak Milestones",
                        Data = new ConfigDTO()
                    };
                }

                if (!streakMilestones.ContainsKey(streak))
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = $"Không tìm thấy milestone với streak {streak}",
                        Data = new ConfigDTO()
                    };
                }

                streakMilestones.Remove(streak);
                streakMilestonesConfig.Value = JsonSerializer.Serialize(streakMilestones);
                streakMilestonesConfig.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // Return updated config
                return await GetConfigAsync();
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi xóa milestone: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }

        public async Task<ResponseDTO<ConfigDTO>> DeleteActionRewardAsync(string tag)
        {
            try
            {
                if (string.IsNullOrEmpty(tag))
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = "Không thể xóa phần thưởng mặc định",
                        Data = new ConfigDTO()
                    };
                }

                var actionRewardsConfig = await dbContext.Configs.FirstOrDefaultAsync(c => c.Key == "ActionRewards");
                
                if (actionRewardsConfig == null || string.IsNullOrEmpty(actionRewardsConfig.Value))
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = "Không tìm thấy cấu hình Action Rewards",
                        Data = new ConfigDTO()
                    };
                }

                ActionRewardsDTO actionRewards;
                try
                {
                    actionRewards = JsonSerializer.Deserialize<ActionRewardsDTO>(actionRewardsConfig.Value)
                        ?? new ActionRewardsDTO();
                }
                catch
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = "Lỗi khi parse cấu hình Action Rewards",
                        Data = new ConfigDTO()
                    };
                }

                if (actionRewards.Tags == null || !actionRewards.Tags.ContainsKey(tag))
                {
                    return new ResponseDTO<ConfigDTO>
                    {
                        IsSuccess = false,
                        Message = $"Không tìm thấy action reward với tag '{tag}'",
                        Data = new ConfigDTO()
                    };
                }

                actionRewards.Tags.Remove(tag);
                actionRewardsConfig.Value = JsonSerializer.Serialize(actionRewards);
                actionRewardsConfig.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // Return updated config
                return await GetConfigAsync();
            }
            catch (Exception ex)
            {
                return new ResponseDTO<ConfigDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi xóa action reward: {ex.Message}",
                    Data = new ConfigDTO()
                };
            }
        }
    }
}

