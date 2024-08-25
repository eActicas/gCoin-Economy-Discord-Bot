const { specialArg, format } = require('../../utils/functions.js');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Blackjack = require('simply-blackjack');
const User = require('../../schemas/user-schema.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setNameLocalizations({
			'pt-BR': 'vinteum',
			'es-ES': 'veintiuno',
		})
		.setDescription('Play a game of blackjack')
		.setDescriptionLocalizations({
			'pt-BR': 'Jogue um jogo de 21',
			'es-ES': 'Juega un juego de 21',
		})
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('gcoins')
				.setDescription(
					'The amount of gcoins you want to bet'
				)
				.setDescriptionLocalizations({
					'pt-BR': 'a quantidade de gcoins para apostar',
					'es-ES': 'la cantidad de gcoins para apostar',
				})
				.setRequired(true)
		),
	execute: async ({ member, interaction, instance, user, database }) => {
		await interaction.deferReply().catch(() => {});
		try {
			var bet = interaction.options.getString('gcoins');
			const { gcoins } = await User.findByIdAndUpdate(user.id, {}, { select: 'gcoins', upsert: true, new: true });
			try {
				bet = await specialArg(bet, gcoins);
			} catch {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'BAD_VALUE', {
						VALUE: gcoins,
					}),
				});
				return;
			}
			if (gcoins >= bet) {
				await User.findByIdAndUpdate(user.id, { $inc: { gcoins: -bet } });

				const Game = new Blackjack({
					decks: 2,
					payouts: {
						blackjack: 1,
						default: 1,
					},
				});
				Game.bet(bet);
				Game.start();

				const enum_cards = {
					A: instance.emojiList['A_'],
					2: instance.emojiList['2_'],
					3: instance.emojiList['3_'],
					4: instance.emojiList['4_'],
					5: instance.emojiList['5_'],
					6: instance.emojiList['6_'],
					7: instance.emojiList['7_'],
					8: instance.emojiList['8_'],
					9: instance.emojiList['9_'],
					10: instance.emojiList['10'],
					J: instance.emojiList['J_'],
					Q: instance.emojiList['Q_'],
					K: instance.emojiList['K_'],
					hidden: instance.emojiList['escondida'],
				};

				var player_cards = [];
				var dealer_cards = [];

				Game.player.forEach((element) => {
					player_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
				});

				Game.table.dealer.cards.forEach((element) => {
					dealer_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
				});
				dealer_cards.push(enum_cards['hidden']);

				const embed = instance.createEmbed(member.displayColor).addFields(
					{
						name: 'BlackJack',
						value: instance.getMessage(interaction, 'BLACKJACK_TITLE', {
							BET: format(bet),
						}),
						inline: false,
					},
					{
						name: instance.getMessage(interaction, 'PLAYER_HAND', {
							CARDS: player_cards.join(' '),
						}),
						value: instance.getMessage(interaction, 'VALUE', {
							VALUE: Game.table.player.total,
						}),
						inline: true,
					},
					{
						name: instance.getMessage(interaction, 'DEALER_HAND', {
							CARDS: dealer_cards.join(' '),
						}),
						value: instance.getMessage(interaction, 'VALUE', {
							VALUE: Game.table.dealer.total,
						}),
						inline: true,
					}
				);

				const row = new ActionRowBuilder().addComponents(
					(hit = new ButtonBuilder()
						.setCustomId('hit')
						.setLabel(instance.getMessage(interaction, 'HIT'))
						.setStyle('Secondary')),
					(stand = new ButtonBuilder()
						.setCustomId('stand')
						.setLabel(instance.getMessage(interaction, 'STAND'))
						.setStyle('Secondary')),
					(double = new ButtonBuilder()
						.setCustomId('double')
						.setLabel(instance.getMessage(interaction, 'DOUBLE'))
						.setStyle('Secondary'))
				);

				var answer = await instance.editReply(interaction, {
					embeds: [embed],
					components: [row],
					fetchReply: true,
				});

				const filter = (btInt) => {
					return instance.defaultFilter(btInt) && btInt.user.id === user.id;
				};

				const collector = answer.createMessageComponentCollector({
					filter,
					time: 1000 * 60 * 30,
				});

				Game.on('end', async (results) => {
					collector.stop();

					var player_cards = [];
					var dealer_cards = [];

					results.player.cards.forEach((element) => {
						player_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
					});

					results.dealer.cards.forEach((element) => {
						dealer_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
					});

					embed.data.fields[1] = {
						name: instance.getMessage(interaction, 'PLAYER_HAND', {
							CARDS: player_cards.join(' '),
						}),
						value: instance.getMessage(interaction, 'VALUE', {
							VALUE: results.player.total,
						}),
						inline: true,
					};
					embed.data.fields[2] = {
						name: instance.getMessage(interaction, 'DEALER_HAND', {
							CARDS: dealer_cards.join(' '),
						}),
						value: instance.getMessage(interaction, 'VALUE', {
							VALUE: results.dealer.total,
						}),
						inline: true,
					};

					if (results.state === 'draw') {
						embed.data.fields[0].value = instance.getMessage(interaction, 'BLACKJACK_DRAW', {
							GCOINS: format(results.bet),
						});
						embed.setColor(9807270);
						await User.findByIdAndUpdate(user.id, { $inc: { gcoins: results.bet } });
					} else if (results.state === 'player_blackjack') {
						embed.data.fields[0].value = instance.getMessage(interaction, 'PLAYER_BLACKJACK', {
							GCOINS: format(results.winnings),
						});
						embed.setColor(15844367);
						await User.findByIdAndUpdate(user.id, { $inc: { gcoins: results.bet + results.winnings } });
					} else if (results.state === 'player_win') {
						if (results.dealer.total > 21) {
							embed.data.fields[0].value = instance.getMessage(interaction, 'DEALER_BUST', {
								GCOINS: format(Math.floor(results.winnings / 2)),
							});
						} else {
							embed.data.fields[0].value = `${instance.getMessage(interaction, 'EARNINGS')}: ${format(
								Math.floor(results.winnings / 2)
							)} gCoins`;
						}
						embed.setColor(3066993);
						await User.findByIdAndUpdate(user.id, {
							$inc: { gcoins: results.bet + Math.floor(results.winnings / 2) },
						});
					} else if (results.state === 'dealer_win') {
						if (results.player.total > 21) {
							embed.data.fields[0].value = instance.getMessage(interaction, 'PLAYER_BUST', {
								GCOINS: format(results.losses),
							});
						} else {
							embed.data.fields[0].value = `${instance.getMessage(interaction, 'LOSSES')}: ${format(
								results.losses
							)} gCoins`;
						}
						embed.setColor(15158332);
					} else {
						embed.data.fields[0].value = instance.getMessage(interaction, 'DEALER_BLACKJACK', {
							GCOINS: format(results.losses),
						});
						embed.setColor(10038562);
					}

					embed.data.fields[0].value += `\n${instance.getMessage(interaction, 'BALANCE')}: ${format(
						(await User.findById(user.id, 'gcoins')).gcoins
					)} gCoins`;

					await instance.editReply(interaction, {
						embeds: [embed],
						components: [row],
					});
				});

				if (Game.table.player.total >= 21) {
					Game.stand();
				}

				collector.on('collect', async (i) => {
					if (i.customId === 'hit') {
						Game.hit();

						double.setDisabled(true);

						if (Game.table.player.total >= 21) {
							Game.stand();
							i.deferUpdate();
						} else {
							var player_cards = [];
							var dealer_cards = [];

							Game.player.forEach((element) => {
								player_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
							});

							Game.table.dealer.cards.forEach((element) => {
								dealer_cards.push(enum_cards[element.name.substr(0, 2).trim()]);
							});
							dealer_cards.push(enum_cards['hidden']);

							embed.data.fields[1] = {
								name: instance.getMessage(interaction, 'PLAYER_HAND', {
									CARDS: player_cards.join(' '),
								}),
								value: instance.getMessage(interaction, 'VALUE', {
									VALUE: Game.table.player.total,
								}),
								inline: true,
							};
							embed.data.fields[2] = {
								name: instance.getMessage(interaction, 'DEALER_HAND', {
									CARDS: dealer_cards.join(' '),
								}),
								value: instance.getMessage(interaction, 'VALUE', {
									VALUE: Game.table.dealer.total,
								}),
								inline: true,
							};

							await i.update({
								embeds: [embed],
								components: [row],
							});
						}
					} else if (i.customId === 'stand') {
						Game.stand();
						i.deferUpdate();
					} else {
						if (gcoins >= bet) {
							User.findByIdAndUpdate(user.id, { $inc: { gcoins: -bet } });
							Game.bet(bet * 2);
							Game.hit();
							Game.stand();
							i.deferUpdate();
						} else {
							i.reply({
								content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
								ephemeral: true,
							});
						}
					}
				});

				collector.on('end', () => {
					if (collector.endReason === 'time') {
						Game.stand();
					}
				});
			} else {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
				});
			}
		} catch (error) {
			console.error(`blackjack: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
				components: [],
			});
		}
	},
};