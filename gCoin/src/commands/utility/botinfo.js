const { msToTime } = require('../../utils/functions.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('botinfo')
		.setDescription('Check some bot stats')
		.setDescriptionLocalizations({
			'pt-BR': 'Veja algumas estatísticas do bot',
			'es-ES': 'Mira algunas estadísticas del bot',
		})
		.setDMPermission(false),
	execute: async ({ client, interaction, instance }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const embed = instance.createEmbed(3426654).addFields({
				name: 'Information about gCoin',
				value: `<:gCoin:1200448866730909766> **Invite:** [INVITE ME](https://discord.com/oauth2/authorize?client_id=1198197427673518151&permissions=0&scope=bot%20applications.commands)\n<:Support:1200465713954033784> **Support:** https://discord.gg/3YhMx8cDq9\n<:Servers:1200466253257642084> ${instance.getMessage(
					interaction,
					'SERVERS'
				)}: ${client.guilds.cache.size}\n<:Players:1200466250355200031> ${instance.getMessage(interaction, 'TOTAL_PLAYERS')}: ${
					(await instance.userSchema.find({})).length
				}\n<:Players:1200466250355200031> ${instance.getMessage(interaction, 'ACTIVE_PLAYERS')}: ${
					(await instance.userSchema.find({ updatedAt: { $gte: new Date(Date.now() - 2592000000) } })).length
				}\n<:Yes:1200460574652366850> ${instance.getMessage(interaction, 'UPTIME')}: ${msToTime(client.uptime)}\n<:sponsor:1200896660155404358> **You can contribute here:** [Contribute](https://www.paypal.me/simonas2001)`,
			});
			await instance.editReply(interaction, { embeds: [embed] });
		} catch (error) {
			console.error(`botinfo: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
