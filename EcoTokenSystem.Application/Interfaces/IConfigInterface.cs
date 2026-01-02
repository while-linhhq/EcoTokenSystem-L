using EcoTokenSystem.Application.DTOs;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IConfigInterface
    {
        Task<ResponseDTO<ConfigDTO>> GetConfigAsync();
        Task<ResponseDTO<ConfigDTO>> UpdateGiftPriceAsync(string giftId, int price);
        Task<ResponseDTO<ConfigDTO>> UpdateStreakMilestoneAsync(string streak, StreakMilestoneDTO milestone);
        Task<ResponseDTO<ConfigDTO>> UpdateActionRewardAsync(string? streakMilestone, int bonusTokens);
        Task<ResponseDTO<ConfigDTO>> UpdateDefaultActionRewardAsync(ActionRewardDTO reward);
        Task<ResponseDTO<ConfigDTO>> DeleteStreakMilestoneAsync(string streak);
        Task<ResponseDTO<ConfigDTO>> DeleteActionRewardAsync(string streakMilestone);
    }
}

