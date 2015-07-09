var _      = require('lodash'),
    moment = require('moment');

exports.parse = function (rawData) {

    if (!/^\*GS/.test(rawData)){
        var err = {msg: 'Invalid Data', data: rawData};
        return err;
    }

    var rawDataArr = rawData.split('#'),
        dataCollection  = [];

    rawDataArr.pop();

    rawDataArr.forEach(function (rawEntry) {
        var parsedData = rawEntry.split(','),
            fixedData  = {};

        _.extend(fixedData, {
            protocol: parsedData[0],
            device: parsedData[1]
        });

        if (parsedData.length <= 3) {
            var command = parsedData[2].split(':'),
                dataCmd = {};

            _.extend(dataCmd, {
                is_data: false,
                protocol: fixedData.protocol,
                device: fixedData.device,
                message_type: command[0],
                message: command[1],
                raw_data: rawData
            });

            return dataCmd;
        }

        var multipleEntries = rawEntry.split('$'),
            first           = true;

        multipleEntries.forEach(function (entry) {

            var parsedEntry = entry.split(','),
                ctr         = 0;

            if (first === true) {
                first = false;
                ctr = 2;
            }


            var data = {
                is_data: true,
                protocol: fixedData.protocol,
                device: fixedData.device,
                dtm: moment(parsedEntry[ctr], 'HHmmssDDMMYY').toDate(),
                event_id: parsedEntry[1 + ctr],
                raw_data: rawData,
                raw_data_entry: entry
            };


            for (var i = 2 + ctr; i < parsedEntry.length; i++) {

                var parsedEvents = parsedEntry[i].split(':'),
                    header       = parsedEvents[0],
                    body         = parsedEvents[1].split(';');

                if (header === 'SYS') {
                    _.extend(data, {
                        sys: true,
                        device_name: body[0],
                        firmware_v: body[1],
                        hardware_v: body[2]
                    });
                } else if (header === 'GPS') {
                    _.extend(data, {
                        gps: true,
                        fix_flag: body[0],
                        satellite_no: body[1],
                        coordinates: [parseFloat(body[3].substr(1, body[3].length - 1)), parseFloat(body[2].substr(1, body[2].length - 1))],
                        lat_dir: body[2].substr(0, 1),
                        lng_dir: body[3].substr(0, 1),
                        speed: parseInt(body[4]),
                        azimuth: parseInt(body[5]),
                        altitude: parseInt(body[6]),
                        hdop: parseFloat(body[7]),
                        vdop: parseFloat(body[8])
                    });
                } else if (header === 'GSM') {
                    _.extend(data, {
                        gms: true,
                        reg_status: parseInt(body[0]),
                        signal: parseInt(body[1]),
                        mcc1_ctry: parseInt(body[2]),
                        mnc1_ntwrk: parseInt(body[3]),
                        lac1_base_code: body[4],
                        cid1_base_idntfr: body[5],
                        rsi1_signal: parseInt(body[6]),
                        mmc2_ctry: parseInt(body[7]),
                        mnc2_ntwrk: parseInt(body[8]),
                        lac2_base_code: body[9],
                        cid2_base_idntfr: body[10],
                        rsi2_signal: parseInt(body[11]),
                        mmc3_ctry: parseInt(body[12]),
                        mnc3_ntwrk: parseInt(body[13]),
                        lac3_base_code: body[14],
                        cid3_base_idntfr: body[15],
                        rsi3_signal: parseInt(body[16])
                    });
                } else if (header === 'COT') {
                    _.extend(data, {
                        cot: true,
                        odometer: parseInt(body[0]),
                        enginehour: body[1]
                    });
                } else if (header === 'ADC') {
                    _.extend(data, {
                        adc: true,
                        ext_pow_volt: parseFloat(body[0]),
                        bkp_bat_volt: parseFloat(body[1])
                    });
                } else if (header === 'DTT') {
                    _.extend(data, {
                        dit: true,
                        dev_status: parseInt(body[0]),
                        dtt_reserved: body[1],
                        geo_status1: parseInt(body[2]),
                        geo_status2: parseInt(body[3]),
                        dtt_event_status: parseInt(body[4]),
                        packet_type: parseInt(body[5])
                    });
                } else if (header === 'ETD') {
                    _.extend(data, {
                        etd: true,
                        etd_data: body[0]
                    });
                } else if (header === 'OBD') {
                    _.extend(data, {
                        obd: true,
                        obd_data: body[0]
                    });

                } else if (header === 'FUL') {
                    _.extend(data, {
                        ful: true,
                        ful_data: body[0]
                    });
                } else if (header === 'TRU') {
                    _.extend(data, {
                        tru: true,
                        tru_data: body[0]
                    });
                }
            }

            dataCollection.push(data);

        });



    });

    return dataCollection;
};