const { SlashCommandBuilder } = require('discord.js');
const { specialArg, randint, format } = require('../../utils/functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('horse')
		.setNameLocalizations({
			'pt-BR': 'cavalo',
			'es-ES': 'caballo',
		})
		.setDescription('Bet in what horse is going to win')
		.setDescriptionLocalizations({
			'pt-BR': 'Aposte em qual cavalo é o mais rápido',
			'es-ES': 'Apostar en qué caballo va a ganar',
		})
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('horse')
				.setNameLocalizations({
					'pt-BR': 'cavalo',
					'es-ES': 'caballo',
				})
				.setDescription('Number of the horse you want to bet in, order is top to bottom')
				.setDescriptionLocalizations({
					'pt-BR': 'Número do cavalo que você vai apostar',
					'es-ES': 'Número del caballo en el que quieres apostar',
				})
				.setRequired(true)
				.addChoices(
					{ name: '1', value: '1' },
					{ name: '2', value: '2' },
					{ name: '3', value: '3' },
					{ name: '4', value: '4' },
					{ name: '5', value: '5' }
				)
		)
		.addStringOption((option) =>
			option
				.setName('gcoins')
				.setDescription(
					'The amount of gCoins you want to bet'
				)
				.setDescriptionLocalizations({
					'pt-BR': 'A quantidade de gCoins para apostar',
					'es-ES': 'La cantidad de gCoins para apostar',
				})
				.setRequired(true)
		),
	execute: async ({ interaction, user, instance, member, database }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const horse = interaction.options.getString('horse');
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
				const horses = ['- - - - -', '- - - - -', '- - - - -', '- - - - -', '- - - - -'];
				const embed = instance
					.createEmbed(member.displayColor)
					.setDescription(
						instance.getMessage(interaction, 'HORSE_DESCRIPTION', {
							BET: format(bet),
							HORSE: horse,
						})
					)
					.addFields({
						name: '\u200b',
						value: `**1.** :checkered_flag:  ${horses[0]} :horse_racing:\n\u200b\n**2.** :checkered_flag:  ${horses[1]} :horse_racing:\n\u200b\n**3.** :checkered_flag:  ${horses[2]} :horse_racing:\n\u200b\n**4.** :checkered_flag:  ${horses[3]} :horse_racing:\n\u200b\n**5.** :checkered_flag:  ${horses[4]}  :horse_racing:`,
					});

				await instance.editReply(interaction, {
					embeds: [embed],
				});

				for (let i = 0; i <= 21; i++) {
					const run = randint(0, 4);
					horses[run] = horses[run].slice(0, -2);

					embed.data.fields[0] = {
						name: '\u200b',
						value: `**1.** :checkered_flag:  ${horses[0]} :horse_racing:\n\u200b\n**2.** :checkered_flag:  ${horses[1]} :horse_racing:\n\u200b\n**3.** :checkered_flag:  ${horses[2]} :horse_racing:\n\u200b\n**4.** :checkered_flag:  ${horses[3]} :horse_racing:\n\u200b\n**5.** :checkered_flag:  ${horses[4]} :horse_racing:`,
					};
					await instance.editReply(interaction, {
						embeds: [embed],
					});

					if (horses[run] === '') {
						var winner = String(run + 1);
						break;
					}

					await new Promise((resolve) => setTimeout(resolve, 250));
				}

				if (horse == winner) {
					player.gcoins += bet * 5;
					embed.setColor(3066993).setDescription(
						instance.getMessage(interaction, 'HORSE_DESCRIPTION_WON', {
							BET: format(bet),
							HORSE: horse,
							GCOINS: format(bet * 5),
							SALDO: format(player.gcoins),
						})
					);
				} else {
					embed.setColor(15158332).setDescription(
						instance.getMessage(interaction, 'HORSE_DESCRIPTION_LOST', {
							BET: format(bet),
							HORSE: horse,
							SALDO: format(player.gcoins),
						})
					);
				}

				await instance.editReply(interaction, {
					embeds: [embed],
				});
			} else {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
				});
			}
			player.save();
		} catch (error) {
			console.error(`horse: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
