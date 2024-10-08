const { SlashCommandBuilder, time } = require('discord.js');
const { specialArg, randint, format, buttons } = require('../../utils/functions.js');
const { log } = require('console');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('russianroulette')
		.setNameLocalizations({
			'pt-BR': 'roletarussa',
			'es-ES': 'ruletarusa',
		})
		.setDescription('Play with other users, last to survive wins all the gCoins')
		.setDescriptionLocalizations({
			'pt-BR': 'Jogue roleta russa com outros usuários, o sovrevivente leva os gCoins',
			'es-ES': 'Juega con otros usuarios, el último en sobrevivir se lleva todos los gCoins',
		})
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('gcoins')
				.setDescription('Amount of gCoins to play with')
				.setDescriptionLocalizations({
					'pt-BR': 'A quantidade de gCoins para apostar',
					'es-ES': 'La cantidad de gCoins para apostar',
				})
				.setRequired(true)
		),
	execute: async ({ interaction, user, instance, database }) => {
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
			}

			const remainingTime = time(Math.floor(Date.now() / 1000) + 60, 'R');

			if (player.gcoins >= bet) {
				var pot = bet;
				const embed = instance
					.createEmbed('#0099ff')
					.setDescription(
						instance.getMessage(interaction, 'RUSSIANROULETTE_DESCRIPTION', {
							USER: user,
							BET: format(pot),
						}) + remainingTime
					)
					.addFields({
						name: instance.getMessage(interaction, 'PLAYERS'),
						value: `${user}`,
						inline: false,
					});
				var answer = await instance.editReply(interaction, {
					embeds: [embed],
					components: [buttons(['accept', 'skip', 'refuse'])],
					fetchReply: true,
				});
				player.gcoins -= bet;

				player.save();

				var users = [user];
				var names = [user];
				mensagens = instance.getMessage(interaction, 'RUSROL');

				const filter = async (btInt) => {
					return instance.defaultFilter(btInt);
				};

				const collector = answer.createMessageComponentCollector({
					filter,
					time: 1000 * 60,
				});

				collector.on('collect', async (i) => {
					const collectorUser = await database.player.findOne(i.user.id);
					if (i.customId === 'refuse' && i.user.id === user.id) {
						collector.stop('refuse');
					} else if (i.customId === 'skip' && i.user.id === user.id && users.length > 1) {
						collector.stop();
					} else if (i.customId === 'accept' && collectorUser.gcoins >= bet && !users.includes(i.user)) {
						collectorUser.gcoins -= bet;
						users.push(i.user);
						names.push(i.user);
						pot += bet;
						embed.setDescription(
							instance.getMessage(interaction, 'RUSSIANROULETTE_DESCRIPTION', {
								USER: user,
								BET: format(pot),
							}) + remainingTime
						);
						embed.data.fields[0] = {
							name: instance.getMessage(interaction, 'PLAYERS'),
							value: `${names.join('\n')}`,
							inline: false,
						};

						await i.update({
							embeds: [embed],
						});

						collectorUser.save();
					}
				});

				collector.on('end', async (collected, reason) => {
					if (reason === 'refuse') {
						for (user of users) {
							const userFile = await database.player.findOne(user.id);
							userFile.gcoins += bet;
							userFile.save();
						}

						embed.setDescription(
							instance.getMessage(interaction, 'RUSSIANROULETTE_CANCEL', {
								USER: user,
								BET: format(pot),
							})
						);
						await interaction.editReply({
							embeds: [embed],
							components: [],
						});
					} else {
						while (users.length > 1) {
							var luck = randint(0, users.length - 1);
							var eliminated = users[luck];
							names.splice(
								names.findIndex((user) => user === eliminated),
								1,
								`~~${eliminated}~~ :skull:`
							);
							users.splice(luck, 1);
							embed.setDescription(
								instance.getMessage(interaction, 'RUSSIANROULETTE_DESCRIPTION2', {
									BET: format(pot),
								}) + `\n${eliminated} ${mensagens[randint(0, mensagens.length - 1)]}`
							);

							embed.data.fields[0] = {
								name: instance.getMessage(interaction, 'PLAYERS'),
								value: `${names.join('\n')}`,
								inline: false,
							};

							await instance.editReply(interaction, {
								embeds: [embed],
								components: [],
							});
							await new Promise((resolve) => setTimeout(resolve, 5000));
						}
						var winner = users[0];
						const winnerFile = await database.player.findOne(winner.id);
						winnerFile.gcoins += pot;
						if (users.length > 1) winnerFile.wins++;
						embed.setDescription(
							instance.getMessage(interaction, 'RUSSIANROULETTE_DESCRIPTION3', {
								BET: format(pot),
								USER: winner,
								SALDO: format(winnerFile.gcoins),
							})
						);

						await instance.editReply(interaction, {
							embeds: [embed],
							components: [],
						});
						winnerFile.save();
					}
				});
			} else if (bet <= 0) {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'BAD_VALUE', {
						VALUE: bet,
					}),
				});
			} else {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
				});
			}
		} catch (error) {
			console.error(`russianroulette: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
				components: [],
			});
		}
	},
};
