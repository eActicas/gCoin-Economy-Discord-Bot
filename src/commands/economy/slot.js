const { specialArg, format, pick } = require('../../utils/functions.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slot')
		.setNameLocalizations({
			'pt-BR': 'níquel',
			'es-ES': 'níquel',
		})
		.setDescription('Bet your gCoins in the slot machine')
		.setDescriptionLocalizations({
			'pt-BR': 'Aposte gcoins no caça-níquel',
			'es-ES': 'Aposte gcoins no caça-níquel',
		})
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('gcoins')
				.setDescription('Amount of gCoins to bet')
				.setDescriptionLocalizations({
					'pt-BR': 'Quantidade de gCoins para apostar',
					'es-ES': 'Cantidad de gCoins para apostar',
				})
				.setRequired(true)
		),
	execute: async ({ interaction, instance, user, member, database }) => {
		try {
			await interaction.deferReply().catch(() => {});
			const gcoins = interaction.options.getString('gcoins');
			const player = await database.player.findOne(user.id);
			try {
				var bet = await specialArg(gcoins, player.gcoins);
			} catch {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'BAD_VALUE', {
						VALUE: gcoins,
					}),
				});
				return;
			}
			if (player.gcoins >= bet) {
				player.gcoins -= bet;
				const choices = [
					[':money_mouth:', 30],
					[':gem:', 10],
					[':moneybag:', 15],
					[':coin:', 25],
					[':dollar:', 20],
				];
				const emote = instance.emojiList['gcoins'];
				const emoji1 = pick(choices);
				const emoji2 = pick(choices);
				const emoji3 = pick(choices);

				const embed = instance.createEmbed(member.displayColor).addFields({
					name: `-------------------\n | ${emote} | ${emote} | ${emote} |\n-------------------`,
					value: `--- **${instance.getMessage(interaction, 'SPINNING')}** ---`,
				});

				await instance.editReply(interaction, {
					embeds: [embed],
				});

				await new Promise((resolve) => setTimeout(resolve, 1500));
				(embed.data.fields[0].name = `-------------------\n | ${emoji1} | ${emote} | ${emote} |\n-------------------`),
					await instance.editReply(interaction, { embeds: [embed] });
				await new Promise((resolve) => setTimeout(resolve, 1500));
				(embed.data.fields[0].name = `-------------------\n | ${emoji1} | ${emoji2} | ${emote} |\n-------------------`),
					await instance.editReply(interaction, { embeds: [embed] });
				await new Promise((resolve) => setTimeout(resolve, 1500));
				(embed.data.fields[0].name = `-------------------\n | ${emoji1} | ${emoji2} | ${emoji3} |\n-------------------`),
					await instance.editReply(interaction, { embeds: [embed] });

				const arrayEmojis = [emoji1, emoji2, emoji3];
				var dollar = arrayEmojis.filter((emoji) => emoji == ':dollar:').length;
				var coin = arrayEmojis.filter((emoji) => emoji == ':coin:').length;
				var moneybag = arrayEmojis.filter((emoji) => emoji == ':moneybag:').length;
				var gem = arrayEmojis.filter((emoji) => emoji == ':gem:').length;
				var money_mouth = arrayEmojis.filter((emoji) => emoji == ':money_mouth:').length;

				if (dollar == 3 || moneybag == 2) {
					var winnings = 3;
				} else if (coin == 3 || money_mouth == 3) {
					var winnings = 2.5;
				} else if (moneybag == 3) {
					var winnings = 7;
				} else if (gem == 3) {
					var winnings = 10;
				} else if (dollar == 2 || coin == 2) {
					var winnings = 2;
				} else if (gem == 2) {
					var winnings = 5;
				} else if (money_mouth == 2) {
					var winnings = 0.5;
				}
				var profit = parseInt(bet * winnings);

				if (profit > 0) {
					player.gcoins += profit;
					var embed2 = instance.createEmbed(3066993).addFields(
						{
							name: `-------------------\n | ${emoji1} | ${emoji2} | ${emoji3} |\n-------------------`,
							value: `--- **${instance.getMessage(interaction, 'YOU_WON')}** ---`,
							inline: false,
						},
						{
							name: instance.getMessage(interaction, 'WINNINGS'),
							value: `${format(profit)} gCoins`,
							inline: true,
						}
					);
				} else {
					var embed2 = instance.createEmbed(15158332).addFields(
						{
							name: `-------------------\n | ${emoji1} | ${emoji2} | ${emoji3} |\n-------------------`,
							value: `--- **${instance.getMessage(interaction, 'YOU_LOST')}** ---`,
							inline: false,
						},
						{
							name: instance.getMessage(interaction, 'LOSSES'),
							value: `${format(bet)} gCoins`,
							inline: true,
						}
					);
				}
				embed2.addFields({
					name: instance.getMessage(interaction, 'BALANCE'),
					value: `${format(player.gcoins)}`,
				});
				await instance.editReply(interaction, {
					embeds: [embed2],
				});
			} else {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
				});
			}
			player.save();
		} catch (error) {
			console.error(`slot: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
