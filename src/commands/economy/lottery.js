const { msToTime, format, specialArg } = require('../../utils/functions.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setNameLocalizations({ 'pt-BR': 'loteria', 'es-ES': 'lotería' })
		.setDescription('Lottery')
		.setDescriptionLocalizations({ 'pt-BR': 'Loteria', 'es-ES': 'lotería' })
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('view')
				.setNameLocalizations({
					'pt-BR': 'ver',
					'es-ES': 'ver',
				})
				.setDescription('View lottery info')
				.setDescriptionLocalizations({
					'pt-BR': 'Veja as informações da loteria',
					'es-ES': 'Veja las informaciones de la lotería',
				})
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('buy')
				.setNameLocalizations({
					'pt-BR': 'comprar',
					'es-ES': 'comprar',
				})
				.setDescription('Buy lottery tickets')
				.setDescriptionLocalizations({
					'pt-BR': 'Compre bilhetes de loteria',
					'es-ES': 'Compre billetes de lotería',
				})
				.addStringOption((option) =>
					option
						.setName('amount')
						.setNameLocalizations({
							'pt-BR': 'quantidade',
							'es-ES': 'cantidad',
						})
						.setDescription('Amount of lottery tickets to buy')
						.setDescriptionLocalizations({
							'pt-BR': 'Quantidade de bilhetes para comprar',
							'es-ES': 'Cantidad de billetes para comprar',
						})
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('history')
				.setNameLocalizations({
					'pt-BR': 'histórico',
					'es-ES': 'histórico',
				})
				.setDescription('See the last 10 winners of the lottery')
				.setDescriptionLocalizations({
					'pt-BR': 'Veja os 10 últimos ganhadores da loteria',
					'es-ES': 'Veja los 10 últimos ganadores de la lotería',
				})
		),
	execute: async ({ user, interaction, instance, database }) => {
		try {
			await interaction.deferReply().catch(() => {});
			const lotto = await instance.lottoSchema.findById('weekly');
			const type = interaction.options.getSubcommand();
			const player = await database.player.findOne(user.id);
			if (type === 'buy') {
				try {
					var amount = specialArg(interaction.options.getString('amount'), parseInt(player.gcoins / 50000));
				} catch {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'BAD_VALUE', {
							VALUE: amount,
						}),
					});
					return;
				}

				if (player.gcoins > amount * 50000) {
					var embed = instance.createEmbed(15844367).addFields({
						name: `<:Ticket:1200473674990497923> ${format(amount)} ` + instance.getMessage(interaction, 'PURCHASED'),
						value: instance.getMessage(interaction, 'LOTTERY_COST', {
							COST: format(amount * 50000),
						}),
					});

					player.gcoins -= amount * 50000;
					player.tickets += amount;

					await instance.editReply(interaction, {
						embeds: [embed],
					});
				} else {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
					});
				}
			} else if (type === 'view') {
				var embed = instance.createEmbed(15844367).addFields(
					{
						name: instance.getMessage(interaction, 'LOTTERY'),
						value: instance.getMessage(interaction, 'LOTTERY_POOL', {
							PRIZE: format(lotto.prize),
						}),
						inline: false,
					},
					{
						name: 'Info',
						value: instance.getMessage(interaction, 'LOTTERY_INFO', {
							TIME: msToTime(lotto.nextDraw - Date.now()),
						}),
						inline: false,
					}
				);

				if (player.tickets > 0) {
					embed.data.fields[0].value += instance.getMessage(interaction, 'LOTTERY_TICKETS', {
						TICKETS: format(player.tickets),
					});
				}

				await instance.editReply(interaction, {
					embeds: [embed],
				});
			} else {
				history = '';
				for (winner of lotto.history) {
					if (winner.winner != undefined) {
						history += instance.getMessage(interaction, 'HISTORY', {
							GCOINS: format(winner.prize),
							USER: winner.winner,
							TICKETS: winner.userTickets,
							TOTAL: winner.totalTickets,
						});
					} else {
						history += instance.getMessage(interaction, 'HISTORY_NO_WINNER', {
							GCOINS: format(winner.prize),
						});
					}
				}

				var embed = instance.createEmbed(15844367).addFields({
					name: instance.getMessage(interaction, 'LOTTERY_WINNERS'),
					value: history,
				});

				await instance.editReply(interaction, {
					embeds: [embed],
				});
			}
			player.save();
		} catch (err) {
			console.error(`lottery: ${err}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
